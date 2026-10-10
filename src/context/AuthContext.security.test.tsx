import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
const state = vi.hoisted(() => ({
  profile: null as Record<string, unknown> | null,
  profileError: null as unknown,
  rolesError: null as unknown,
  roles: [{ role: 'admin' }],
  rpc: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  isDemoModeEnabled: false,
  supabaseRuntime: {
    auth: {
      getSession: async () => ({
        data: {
          session: {
            user: {
              id: 'fixture',
              email: 'admin@practicekoro.online',
              user_metadata: { role: 'admin', admin_role: 'super_admin' },
            },
          },
        },
      }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn(),
    },
    rpc: state.rpc,
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          table === 'profiles'
            ? { maybeSingle: async () => ({ data: state.profile, error: state.profileError }) }
            : Promise.resolve({ data: state.roles, error: state.rolesError }),
      }),
      upsert: async () => ({ error: null }),
    }),
  },
}));
function Probe() {
  const a = useAuth();
  return (
    <p>
      {a.loading
        ? 'loading'
        : `${a.isAdmin}:${a.hasPermission('canManageSettings')}:${a.user?.adminRole || 'none'}`}
    </p>
  );
}
beforeEach(() => {
  state.profile = {
    id: 'fixture',
    email: 'admin@practicekoro.online',
    full_name: 'Fixture',
    role: 'admin',
    admin_role: 'super_admin',
    account_status: 'active',
  };
  state.profileError = null;
  state.rolesError = null;
  state.roles = [{ role: 'admin' }];
  state.rpc.mockReset();
  state.rpc.mockResolvedValue({ data: false, error: null });
  localStorage.clear();
});
afterEach(cleanup);
describe('authoritative staff resolution', () => {
  it('allows a verified active super admin', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    expect(await screen.findByText('true:true:super_admin')).toBeInTheDocument();
  });
  it.each(['unknown', null, '', undefined])(
    'does not default invalid sub-role %j to super admin',
    async (role) => {
      state.profile!.admin_role = role;
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>
      );
      await screen.findByText('false:false:none');
      expect(state.rpc).not.toHaveBeenCalledWith('sync_admin_profile');
    }
  );
  it.each(['profile', 'roles', 'missing', 'role-mismatch'])(
    'fails closed on %s despite allowlisted email and metadata',
    async (mode) => {
      if (mode === 'profile') state.profileError = { message: 'unavailable' };
      if (mode === 'roles') state.rolesError = { message: 'unavailable' };
      if (mode === 'missing') state.profile = null;
      if (mode === 'role-mismatch') state.roles = [];
      render(
        <AuthProvider>
          <Probe />
        </AuthProvider>
      );
      await waitFor(() => expect(screen.getByText('false:false:none')).toBeInTheDocument());
      expect(state.rpc).not.toHaveBeenCalledWith('sync_admin_profile');
    }
  );
  it('retains content permissions without billing/settings permissions', async () => {
    state.profile!.admin_role = 'content_writer';
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await screen.findByText('true:false:content_writer');
  });
});
