import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AdminAuditLog, AdminRole, AdminStaffMember, UserProfile } from '@/types';
import { localAuditLogs, localStaffUsers } from '@/services/domains/localStore';

export interface CreateAuditLogInput {
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, any>;
  adminUser?: UserProfile | null;
}

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  adminEmail?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Log an administrative activity to public.admin_audit_logs with in-memory fallback.
 * Gracefully swallows any network failure so user workflows never crash.
 */
export async function logAdminActivity(input: CreateAuditLogInput): Promise<void> {
  try {
    let adminEmail = input.adminUser?.email;
    let adminName = input.adminUser?.fullName;
    let adminId = input.adminUser?.id;
    let adminRole: AdminRole = input.adminUser?.adminRole || 'super_admin';

    // If adminUser was not provided, attempt to retrieve from localStorage or session
    if (!adminEmail && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('practicekoro_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          adminEmail = parsed.email;
          adminName = parsed.fullName;
          adminId = parsed.id;
          adminRole = parsed.adminRole || 'super_admin';
        }
      } catch {
        // ignore parse error
      }
    }

    const newLog: AdminAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      adminId: adminId || undefined,
      adminEmail: adminEmail || 'admin@practicekoro.online',
      adminName: adminName || 'Administrator',
      adminRole,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityName: input.entityName,
      details: input.details || {},
      createdAt: new Date().toISOString(),
    };

    // Always record to local in-memory fallback store
    localAuditLogs.unshift(newLog);

    if (isSupabaseConfigured) {
      await supabase.from('admin_audit_logs').insert({
        admin_id: adminId || null,
        admin_email: newLog.adminEmail,
        admin_name: newLog.adminName,
        admin_role: newLog.adminRole,
        action: newLog.action,
        entity_type: newLog.entityType,
        entity_id: newLog.entityId || null,
        entity_name: newLog.entityName || null,
        details: newLog.details || {},
      });
    }
  } catch (err) {
    console.warn('[AuditLog] Non-blocking audit log failure:', err);
  }
}

/**
 * Retrieve paginated and filtered audit logs
 */
export async function getAdminAuditLogs(
  filters: AuditLogFilters = {}
): Promise<{ logs: AdminAuditLog[]; total: number }> {
  const { action, entityType, adminEmail, search, limit = 50, offset = 0 } = filters;

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('admin_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (action && action !== 'all') {
        query = query.eq('action', action);
      }
      if (entityType && entityType !== 'all') {
        query = query.eq('entity_type', entityType);
      }
      if (adminEmail) {
        query = query.ilike('admin_email', `%${adminEmail.trim()}%`);
      }
      if (search && search.trim()) {
        const s = search.trim();
        query = query.or(
          `entity_name.ilike.%${s}%,admin_email.ilike.%${s}%,admin_name.ilike.%${s}%`
        );
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (!error && data) {
        const mapped: AdminAuditLog[] = data.map((row: any) => ({
          id: row.id,
          adminId: row.admin_id,
          adminEmail: row.admin_email,
          adminName: row.admin_name,
          adminRole: (row.admin_role as AdminRole) || 'super_admin',
          action: row.action,
          entityType: row.entity_type,
          entityId: row.entity_id,
          entityName: row.entity_name,
          details: row.details || {},
          ipAddress: row.ip_address,
          createdAt: row.created_at,
        }));
        return { logs: mapped, total: count || mapped.length };
      }
    } catch (err) {
      console.warn('[AuditLog] Supabase fetch error:', err);
    }
    return { logs: [], total: 0 };
  }

  // Local fallback
  let filtered = [...localAuditLogs];

  if (action && action !== 'all') {
    filtered = filtered.filter((l) => l.action === action);
  }
  if (entityType && entityType !== 'all') {
    filtered = filtered.filter((l) => l.entityType === entityType);
  }
  if (adminEmail) {
    filtered = filtered.filter((l) =>
      l.adminEmail.toLowerCase().includes(adminEmail.trim().toLowerCase())
    );
  }
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    filtered = filtered.filter(
      (l) =>
        (l.entityName && l.entityName.toLowerCase().includes(term)) ||
        l.adminEmail.toLowerCase().includes(term) ||
        (l.adminName && l.adminName.toLowerCase().includes(term))
    );
  }

  const total = filtered.length;
  const logs = filtered.slice(offset, offset + limit);
  return { logs, total };
}

/**
 * Export audit logs to an Excel-ready CSV file with UTF-8 BOM
 */
export function exportAuditLogsToCsv(logs: AdminAuditLog[]): void {
  const headers = [
    'Date & Time (IST)',
    'Admin Email',
    'Admin Name',
    'Role',
    'Action',
    'Entity Type',
    'Entity Target',
    'Details Summary',
  ];

  const escapeCell = (cell: any): string => {
    if (cell == null) return '""';
    const str = typeof cell === 'object' ? JSON.stringify(cell) : String(cell);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = logs.map((log) => [
    new Date(log.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    log.adminEmail,
    log.adminName || 'Admin',
    log.adminRole,
    log.action,
    log.entityType,
    log.entityName || log.entityId || 'N/A',
    JSON.stringify(log.details || {}),
  ]);

  const csvRows = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ];
  const csvContent = '\uFEFF' + csvRows.join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `PracticeKoro_Admin_Audit_Logs_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get list of staff users (admins, content writers, support agents)
 */
export async function getStaffMembers(): Promise<AdminStaffMember[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, phone, role, admin_role, created_at, updated_at')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data
          .filter((row: any) => {
            const email = (row.email || '').trim().toLowerCase();
            const isPrimary = email === 'admin@practicekoro.online';
            const hasValidAdminRole = ['super_admin', 'content_writer', 'support_agent'].includes(
              row.admin_role
            );
            // Only admin@practicekoro.online can be default admin; others must have explicit staff role
            return isPrimary || hasValidAdminRole;
          })
          .map((row: any) => {
            const email = (row.email || '').trim().toLowerCase();
            const isPrimary = email === 'admin@practicekoro.online';
            return {
              id: row.id,
              email: row.email || '',
              fullName: row.full_name || (isPrimary ? 'Susanta Lohar' : 'Staff Member'),
              avatarUrl: row.avatar_url || undefined,
              phone: row.phone || undefined,
              role: 'admin',
              // ONLY admin@practicekoro.online is super_admin by default
              adminRole: isPrimary
                ? 'super_admin'
                : ((row.admin_role as AdminRole) || 'content_writer'),
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            };
          });
      }
    } catch (err) {
      console.warn('[Staff] Supabase fetch error:', err);
    }
    return [];
  }

  return [...localStaffUsers];
}

/**
 * Remove / demote a staff member back to regular student
 */
export async function removeStaffMember(
  userId: string,
  adminUser?: UserProfile | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isSupabaseConfigured) {
      // 1. Try secure RPC
      const { error: rpcError } = await supabase.rpc('remove_admin_staff_member', {
        p_user_id: userId,
      });

      if (rpcError) {
        // Fallback to direct table update if RPC is not yet applied
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            role: 'student',
            admin_role: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profileErr) {
          return { success: false, error: profileErr.message };
        }

        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'student' }, { onConflict: 'user_id,role' });
      }
    }

    // Update in local fallback store
    const idx = localStaffUsers.findIndex((s) => s.id === userId);
    if (idx !== -1) {
      localStaffUsers.splice(idx, 1);
    }

    await logAdminActivity({
      action: 'STAFF_ROLE_REVOKE',
      entityType: 'staff',
      entityId: userId,
      details: { demotedTo: 'student' },
      adminUser,
    });

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to remove staff member',
    };
  }
}

/**
 * Update staff member's admin sub-role (Super Admin only)
 */
export async function updateStaffRole(
  userId: string,
  newRole: AdminRole,
  adminUser?: UserProfile | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isSupabaseConfigured) {
      // Try calling RPC first
      const { error } = await supabase.rpc('update_admin_staff_role', {
        p_user_id: userId,
        p_admin_role: newRole,
      });

      if (error) {
        // Fallback to direct table update if RPC fails
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({
            role: 'admin',
            admin_role: newRole,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateErr) {
          return { success: false, error: updateErr.message };
        }

        // Also ensure user_roles row
        await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' });
      }
    }

    // Update in local fallback store
    const localMember = localStaffUsers.find((s) => s.id === userId);
    if (localMember) {
      localMember.adminRole = newRole;
      localMember.role = 'admin';
    }

    // Log this action to audit log!
    await logAdminActivity({
      action: 'STAFF_ROLE_UPDATE',
      entityType: 'staff',
      entityId: userId,
      entityName: localMember ? `${localMember.fullName} (${localMember.email})` : userId,
      details: { newRole },
      adminUser,
    });

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update staff role',
    };
  }
}

/**
 * Invite or assign a registered user by email to an admin staff sub-role
 */
export async function assignStaffByEmail(
  email: string,
  assignedRole: AdminRole,
  adminUser?: UserProfile | null
): Promise<{ success: boolean; error?: string; member?: AdminStaffMember }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: 'Email is required' };

    if (isSupabaseConfigured) {
      // Find profile by email
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (error) return { success: false, error: error.message };
      if (!profile) {
        return {
          success: false,
          error: `No user account found with email "${cleanEmail}". They must register an account first.`,
        };
      }

      // Update role & admin_role
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          admin_role: assignedRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateErr) return { success: false, error: updateErr.message };

      await supabase
        .from('user_roles')
        .upsert({ user_id: profile.id, role: 'admin' }, { onConflict: 'user_id,role' });

      await logAdminActivity({
        action: 'STAFF_ROLE_ASSIGN',
        entityType: 'staff',
        entityId: profile.id,
        entityName: `${profile.full_name || 'Staff'} (${cleanEmail})`,
        details: { assignedRole },
        adminUser,
      });

      const member: AdminStaffMember = {
        id: profile.id,
        email: cleanEmail,
        fullName: profile.full_name || 'Staff Member',
        role: 'admin',
        adminRole: assignedRole,
        createdAt: profile.created_at || new Date().toISOString(),
      };
      return { success: true, member };
    }

    // Local fallback
    let existing = localStaffUsers.find((s) => s.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.adminRole = assignedRole;
    } else {
      existing = {
        id: `staff_${Date.now()}`,
        email: cleanEmail,
        fullName: cleanEmail.split('@')[0],
        role: 'admin',
        adminRole: assignedRole,
        createdAt: new Date().toISOString(),
      };
      localStaffUsers.push(existing);
    }

    await logAdminActivity({
      action: 'STAFF_ROLE_ASSIGN',
      entityType: 'staff',
      entityId: existing.id,
      entityName: `${existing.fullName} (${cleanEmail})`,
      details: { assignedRole },
      adminUser,
    });

    return { success: true, member: existing };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to assign staff member',
    };
  }
}
