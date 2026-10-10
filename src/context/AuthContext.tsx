import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  supabaseRuntime as supabase,
  isSupabaseConfigured,
  isDemoModeEnabled,
} from '@/lib/supabase';
import type { Database } from '@/types/database';
import type {
  UserProfile,
  UserRole,
  AdminRole,
  AdminPermissions,
  StudentCategoryCode,
  StudentGenderCode,
  PreparationStatusCode,
} from '@/types';
import { getAdminPermissions } from '@/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'] & {
  admin_role?: string | null;
  account_status?: 'active' | 'inactive';
  district?: string | null;
  state?: string | null;
  gender?: string | null;
  category?: string | null;
  dob?: string | null;
  preferred_subjects?: any;
  preparation_status?: string | null;
};

/**
 * Resolve the full UserProfile from Supabase. The role is authoritative
 * from the user_roles + profiles tables ONLY — an allow-listed email
 * never grants admin by itself. Promotion happens exclusively server-side
 * via the SECURITY DEFINER sync_admin_profile RPC; the client never
 * writes admin roles (no user_roles upserts, no profiles role updates).
 */
class InactiveAccountError extends Error {}

const resolveUserProfile = async (supabaseUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}): Promise<UserProfile> => {
  try {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', supabaseUser.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', supabaseUser.id),
    ]);

    let profile = profileRes.data as ProfileRow | null;
    if (profile?.account_status === 'inactive')
      throw new InactiveAccountError('This account is inactive. Contact support.');
    if (profileRes.error || rolesRes.error) throw new Error('Unable to verify account permissions');
    const validAdminRole =
      profile?.admin_role === 'super_admin' ||
      profile?.admin_role === 'content_writer' ||
      profile?.admin_role === 'support_agent';
    const isAdminUser =
      profile?.role === 'admin' &&
      profile.account_status === 'active' &&
      validAdminRole &&
      (rolesRes.data || []).some((r: { role: string }) => r.role === 'admin');
    const effectiveRole: UserRole = isAdminUser
      ? 'admin'
      : profile?.role === 'instructor'
        ? 'instructor'
        : 'student';

    const meta = supabaseUser.user_metadata || {};
    const metaFullName = ((meta.full_name || meta.name || '') as string).trim();
    const metaAvatar = ((meta.avatar_url || meta.picture || '') as string).trim();

    // Create profile if it doesn't exist yet (e.g. first Google sign-in)
    if (!profile) {
      const initialName = metaFullName || supabaseUser.email?.split('@')[0] || 'Candidate';
      const initialDistrict = ((meta.district || '') as string).trim() || null;
      const initialGender = meta.gender || 'NOT_SPECIFIED';
      const initialCategory = meta.category || 'GEN';
      const newProfile = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        full_name: initialName,
        avatar_url: metaAvatar || null,
        district: initialDistrict,
        state: meta.state || 'West Bengal',
        gender: initialGender,
        category: initialCategory,
        role: effectiveRole,
      };
      try {
        await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
      } catch (err) {
        console.warn('Profile upsert warning:', err);
      }

      profile = newProfile as ProfileRow;
    } else {
      // Sync avatar or full_name from Google OAuth if missing from profile
      const needsAvatarUpdate = !profile.avatar_url && Boolean(metaAvatar);
      const needsNameUpdate =
        (!profile.full_name || profile.full_name === profile.email?.split('@')[0]) &&
        Boolean(metaFullName);

      if (needsAvatarUpdate || needsNameUpdate) {
        const updates: Record<string, string> = {};
        if (needsAvatarUpdate) updates.avatar_url = metaAvatar;
        if (needsNameUpdate) updates.full_name = metaFullName;

        try {
          await supabase.from('profiles').update(updates).eq('id', supabaseUser.id);
        } catch (err) {
          console.warn('Profile sync warning:', err);
        }
      }
    }

    const adminSubRole = isAdminUser ? (profile?.admin_role as AdminRole) : undefined;

    const prefSubs = Array.isArray(profile?.preferred_subjects)
      ? profile.preferred_subjects
      : Array.isArray(meta.preferred_subjects)
        ? meta.preferred_subjects
        : [];

    return {
      id: profile?.id || supabaseUser.id,
      fullName: profile?.full_name || metaFullName || supabaseUser.email?.split('@')[0] || 'User',
      email: profile?.email || supabaseUser.email || '',
      phone: profile?.phone ?? undefined,
      avatarUrl: profile?.avatar_url || metaAvatar || undefined,
      district: profile?.district || ((meta.district || '') as string).trim() || undefined,
      state: profile?.state || meta.state || 'West Bengal',
      dob: profile?.dob || meta.dob || undefined,
      gender: (profile?.gender || meta.gender || 'NOT_SPECIFIED') as StudentGenderCode,
      category: (profile?.category || meta.category || 'GEN') as StudentCategoryCode,
      targetExamId: profile?.target_exam_id || meta.target_exam_id || undefined,
      targetExamTitle: meta.target_exam_title || undefined,
      preferredSubjects: prefSubs,
      preparationStatus: (profile?.preparation_status ||
        meta.preparation_status ||
        'BEGINNER') as PreparationStatusCode,
      role: effectiveRole,
      adminRole: effectiveRole === 'admin' ? adminSubRole : undefined,
      createdAt: profile?.created_at || new Date().toISOString(),
    };
  } catch (err) {
    if (err instanceof InactiveAccountError) throw err;
    console.error('Supabase profile resolve error:', err);
    const meta = supabaseUser.user_metadata || {};
    return {
      id: supabaseUser.id,
      fullName: meta.full_name || meta.name || supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      avatarUrl: meta.avatar_url || meta.picture || undefined,
      role: 'student',
      createdAt: new Date().toISOString(),
    };
  }
};

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  adminRole: AdminRole;
  permissions: AdminPermissions;
  hasPermission: (permission: keyof AdminPermissions) => boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isPro: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null; role?: UserRole }>;
  loginWithGoogle: (targetRedirect?: string) => Promise<{ error: Error | null }>;
  register: (
    fullName: string,
    email: string,
    password: string,
    district?: string
  ) => Promise<{ error: Error | null; role?: UserRole; needsConfirmation?: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (updates: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    district?: string;
    state?: string;
    gender?: StudentGenderCode;
    category?: StudentCategoryCode;
    dob?: string;
    targetExamId?: string;
    targetExamTitle?: string;
    preferredSubjects?: string[];
    preparationStatus?: PreparationStatusCode;
  }) => Promise<{ error: Error | null; user?: UserProfile }>;
  refreshProStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start logged out. The real session (if any) is resolved in `initAuth`
  // below. Never fall back to a fake/demo user — a visitor without a valid
  // Supabase session must see the public site, not a logged-in dashboard.
  const [user, setUser] = useState<UserProfile | null>(null);

  const [isPro, setIsPro] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);

  const refreshProStatus = useCallback(async (): Promise<boolean> => {
    // UI hint only: this flag (and its localStorage cache) must never gate
    // paid content by itself — premium access is enforced server-side via
    // has_test_access() inside start_test_attempt / get_student_exam_questions
    // (403 without an active subscription). A user editing localStorage only
    // changes cosmetics, never access.
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('has_active_subscription');
        if (!error && typeof data === 'boolean') {
          setIsPro(data);
          localStorage.setItem('practicekoro_is_pro', data ? 'true' : 'false');
          return data;
        }
      } catch (err) {
        console.warn('Could not verify active subscription from Supabase:', err);
      }
    }
    const local = localStorage.getItem('practicekoro_is_pro') === 'true';
    setIsPro(local);
    return local;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || isDemoModeEnabled) {
      setLoading(false);
      return;
    }

    // Check active Supabase session on mount
    const initAuth = async () => {
      try {
        // Handle OAuth PKCE code exchange from redirect
        if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
          const params = new URLSearchParams(window.location.search);
          const code = params.get('code');
          if (code) {
            try {
              await supabase.auth.exchangeCodeForSession(code);
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            } catch (exchangeErr) {
              console.warn('OAuth PKCE exchange handled or error:', exchangeErr);
            }
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          const userObj = await resolveUserProfile(session.user);
          setUser(userObj);
          localStorage.setItem('practicekoro_user', JSON.stringify(userObj));
          await refreshProStatus();
        } else {
          // No active Supabase session: the visitor is logged out. Never
          // restore a cached profile or fall back to a demo user here — a
          // stale cache is exactly how a previous account could appear
          // "still logged in" without a valid session. Clear it instead.
          setUser(null);
          setIsPro(false);
          localStorage.removeItem('practicekoro_user');
          localStorage.removeItem('practicekoro_is_pro');
        }
      } catch (err) {
        console.error('Supabase session load error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const userObj = await resolveUserProfile(session.user);
          setUser(userObj);
          localStorage.setItem('practicekoro_user', JSON.stringify(userObj));
          await refreshProStatus();
        } catch (err) {
          setUser(null);
          setIsPro(false);
          localStorage.removeItem('practicekoro_user');
          localStorage.removeItem('practicekoro_is_pro');
          if (err instanceof InactiveAccountError)
            queueMicrotask(() => {
              void supabase.auth.signOut();
            });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsPro(false);
        localStorage.removeItem('practicekoro_user');
        localStorage.removeItem('practicekoro_is_pro');
      }
    });

    const handleSubUpdated = () => {
      refreshProStatus();
    };
    window.addEventListener('practicekoro:subscription_updated', handleSubUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('practicekoro:subscription_updated', handleSubUpdated);
    };
  }, [refreshProStatus]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null; role?: UserRole }> => {
    // NOTE: do NOT toggle the global `loading` flag here. Route guards
    // (ProtectedRoute/AdminRoute/PublicOnlyRoute) replace their children with
    // a spinner while loading is true, which would unmount the Login/Register
    // form mid-submit and silently discard the result/error. Those pages show
    // their own local progress state instead. `loading` is only for the
    // initial session bootstrap in the effect above.
    try {
      if (!isSupabaseConfigured) {
        return {
          error: new Error('Authentication service is not configured. Please try again later.'),
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { error };

      let authenticatedRole: UserRole = 'student';
      if (data.user) {
        // Single enforcement point: same resolver as session bootstrap —
        // role strictly from the database, promotion server-side only.
        const userObj = await resolveUserProfile(data.user);
        authenticatedRole = userObj.role;

        setUser(userObj);
        localStorage.setItem('practicekoro_user', JSON.stringify(userObj));
      }
      return { error: null, role: authenticatedRole };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const loginWithGoogle = async (targetRedirect?: string): Promise<{ error: Error | null }> => {
    // NOTE: same as login() — do not toggle global `loading` (see above).
    try {
      if (!isSupabaseConfigured) {
        return {
          error: new Error('Authentication service is not configured. Please try again later.'),
        };
      }

      const redirectUri = targetRedirect || `${window.location.origin}/dashboard`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    district?: string
  ): Promise<{ error: Error | null; role?: UserRole; needsConfirmation?: boolean }> => {
    // NOTE: same as login() — do not toggle global `loading` (see above).
    try {
      if (!isSupabaseConfigured) {
        return {
          error: new Error('Authentication service is not configured. Please try again later.'),
        };
      }

      const cleanEmail = email.trim();
      const cleanName = fullName.trim();
      const cleanDistrict = district?.trim() || null;
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            ...(cleanDistrict ? { district: cleanDistrict } : {}),
          },
        },
      });

      if (error) return { error };

      // Registration never grants staff privileges.
      const registeredRole: UserRole = 'student';

      // Email confirmation ON (production default): Supabase returns a user
      // but NO session. Never mark the visitor logged in without a session —
      // that fake state breaks every authenticated call afterwards.
      if (data.user && !data.session) {
        return { error: null, role: registeredRole, needsConfirmation: true };
      }

      if (data.user && data.session) {
        const newUser = await resolveUserProfile(data.user);
        setUser(newUser);
        localStorage.setItem('practicekoro_user', JSON.stringify(newUser));
      }
      return { error: null, role: registeredRole };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setUser(null);
    setIsPro(false);
    localStorage.removeItem('practicekoro_user');
    localStorage.removeItem('practicekoro_is_pro');
  };

  const updateProfile = async (updates: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    district?: string;
    state?: string;
    gender?: StudentGenderCode;
    category?: StudentCategoryCode;
    dob?: string;
    targetExamId?: string;
    targetExamTitle?: string;
    preferredSubjects?: string[];
    preparationStatus?: PreparationStatusCode;
  }): Promise<{ error: Error | null; user?: UserProfile }> => {
    if (!user) return { error: new Error('User is not logged in') };

    const updatedFullName =
      updates.fullName !== undefined ? updates.fullName.trim() : user.fullName;
    const updatedPhone = updates.phone !== undefined ? updates.phone.trim() : user.phone;
    const updatedAvatarUrl =
      updates.avatarUrl !== undefined ? updates.avatarUrl.trim() : user.avatarUrl;
    const updatedDistrict =
      updates.district !== undefined ? updates.district.trim() : user.district;
    const updatedState =
      updates.state !== undefined ? updates.state.trim() : user.state || 'West Bengal';
    const updatedGender =
      updates.gender !== undefined ? updates.gender : user.gender || 'NOT_SPECIFIED';
    const updatedCategory =
      updates.category !== undefined ? updates.category : user.category || 'GEN';
    const updatedDob = updates.dob !== undefined ? updates.dob.trim() : user.dob;
    const updatedTargetExamId =
      updates.targetExamId !== undefined ? updates.targetExamId : user.targetExamId;
    const updatedTargetExamTitle =
      updates.targetExamTitle !== undefined ? updates.targetExamTitle : user.targetExamTitle;
    const updatedPreferredSubjects =
      updates.preferredSubjects !== undefined
        ? updates.preferredSubjects
        : user.preferredSubjects || [];
    const updatedPreparationStatus =
      updates.preparationStatus !== undefined
        ? updates.preparationStatus
        : user.preparationStatus || 'BEGINNER';

    if (!updatedFullName) {
      return { error: new Error('Full Name cannot be empty') };
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);

    try {
      if (isSupabaseConfigured && isUuid) {
        const fullPayload: Record<string, any> = {
          full_name: updatedFullName,
          phone: updatedPhone || null,
          avatar_url: updatedAvatarUrl || null,
          district: updatedDistrict || null,
          state: updatedState || 'West Bengal',
          gender: updatedGender,
          category: updatedCategory,
          dob: updatedDob || null,
          target_exam_id: updatedTargetExamId || null,
          preferred_subjects: updatedPreferredSubjects,
          preparation_status: updatedPreparationStatus,
          updated_at: new Date().toISOString(),
        };

        let { error: profileError } = await supabase
          .from('profiles')
          .update(fullPayload)
          .eq('id', user.id);

        // Resilient fallback if newer demographic columns are not yet in Supabase schema cache
        if (
          profileError &&
          (profileError.message?.toLowerCase().includes('schema cache') ||
            profileError.message?.includes('column') ||
            profileError.code === 'PGRST204')
        ) {
          console.warn(
            'Notice: Demographic columns not yet in profiles schema cache. Retrying basic profile update and saving full details to auth metadata.'
          );
          const basicPayload: Record<string, any> = {
            full_name: updatedFullName,
            phone: updatedPhone || null,
            avatar_url: updatedAvatarUrl || null,
            updated_at: new Date().toISOString(),
          };
          if (updatedDistrict) basicPayload.district = updatedDistrict;

          const { error: retryError } = await supabase
            .from('profiles')
            .update(basicPayload)
            .eq('id', user.id);

          profileError = retryError;
        }

        if (profileError) {
          return { error: profileError };
        }

        try {
          await supabase.auth.updateUser({
            data: {
              full_name: updatedFullName,
              avatar_url: updatedAvatarUrl || null,
              district: updatedDistrict || null,
              state: updatedState,
              gender: updatedGender,
              category: updatedCategory,
              dob: updatedDob,
              target_exam_id: updatedTargetExamId,
              target_exam_title: updatedTargetExamTitle,
              preferred_subjects: updatedPreferredSubjects,
              preparation_status: updatedPreparationStatus,
            },
          });
        } catch (authErr) {
          console.warn('Could not sync user_metadata in auth:', authErr);
        }
      }

      const updatedUser: UserProfile = {
        ...user,
        fullName: updatedFullName,
        phone: updatedPhone,
        avatarUrl: updatedAvatarUrl,
        district: updatedDistrict || undefined,
        state: updatedState,
        gender: updatedGender,
        category: updatedCategory,
        dob: updatedDob,
        targetExamId: updatedTargetExamId,
        targetExamTitle: updatedTargetExamTitle,
        preferredSubjects: updatedPreferredSubjects,
        preparationStatus: updatedPreparationStatus,
      };

      setUser(updatedUser);
      localStorage.setItem('practicekoro_user', JSON.stringify(updatedUser));

      return { error: null, user: updatedUser };
    } catch (err: unknown) {
      return { error: err as Error };
    }
  };

  const role: UserRole = user?.role || 'student';
  const isAdmin =
    role === 'admin' &&
    ['super_admin', 'content_writer', 'support_agent'].includes(user?.adminRole || '');
  const isStudent = !isAdmin;
  const adminRole: AdminRole = user?.adminRole || 'content_writer';
  const permissions: AdminPermissions = getAdminPermissions(isAdmin ? user?.adminRole : undefined);

  const hasPermission = (permission: keyof AdminPermissions): boolean => {
    if (!isAdmin) return false;
    return Boolean(permissions[permission]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        adminRole,
        permissions,
        hasPermission,
        isAdmin,
        isStudent,
        isPro,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        refreshProStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
