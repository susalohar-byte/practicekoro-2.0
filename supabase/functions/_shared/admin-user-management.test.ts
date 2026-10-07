import { describe, expect, it, vi } from 'vitest';
import { manageUsers } from './admin-user-management';
const actor = { id: 'admin', role: 'admin', admin_role: 'super_admin', account_status: 'active' };
const student = {
  id: 'u1',
  role: 'student',
  email: 'learner@example.com',
  account_status: 'active',
};
function makeClient(reads: any[] = [actor, student]) {
  const state = {
    reads: [...reads],
    saved: { data: { id: 'u1' }, error: null as any },
    profile: { error: null as any },
    updates: [] as any[],
  };
  const auth = {
    admin: {
      inviteUserByEmail: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: 'new-user-id' } }, error: null }),
      deleteUser: vi.fn().mockResolvedValue({ error: null }),
      updateUserById: vi.fn().mockResolvedValue({ error: null }),
    },
  };
  const client = {
    auth,
    from: vi.fn(() => {
      let updated = false;
      const q: any = {};
      q.select = vi.fn(() => q);
      q.eq = vi.fn(() => q);
      q.update = vi.fn((payload) => {
        updated = true;
        state.updates.push(payload);
        return q;
      });
      q.maybeSingle = vi.fn(async () =>
        updated ? state.saved : { data: state.reads.shift() ?? null, error: null }
      );
      q.upsert = vi.fn(async () => state.profile);
      return q;
    }),
  };
  return { client, state };
}
describe('server-only management authorization and persistence', () => {
  it('cleans up an invited Auth account even when the profile save throws', async () => {
    const { client } = makeClient([actor, null]);
    client.from.mockImplementationOnce(() => {
      const q: any = {};
      q.select = () => q; q.eq = () => q;
      q.maybeSingle = async () => ({ data: actor, error: null });
      return q;
    }).mockImplementationOnce(() => {
      const q: any = {};
      q.select = () => q; q.eq = () => q;
      q.maybeSingle = async () => ({ data: null, error: null });
      return q;
    }).mockImplementationOnce(() => ({
      upsert: async () => { throw new Error('Network failed'); },
    }));
    const result = await manageUsers(client, 'admin', {
      action: 'create_student', fullName: 'Learner', email: 'learner@example.com',
    });
    expect(result).toMatchObject({ success: false, error: 'Network failed' });
    expect(client.auth.admin.deleteUser).toHaveBeenCalledWith('new-user-id');
  });
  it.each([
    { ...actor, account_status: 'inactive' },
    { ...actor, admin_role: 'content_writer' },
    { ...actor, admin_role: 'support_agent' },
    { ...actor, role: 'student' },
    null,
  ])('rejects unauthorized actors before privileged Auth operations', async (profile) => {
    const { client } = makeClient([profile]);
    expect(
      (
        await manageUsers(client, 'admin', {
          action: 'create_student',
          fullName: 'Name',
          email: 'n@example.com',
        })
      ).success
    ).toBe(false);
    expect(client.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });
  it('creates a real Auth invitation and profile, returning the Auth ID', async () => {
    const { client } = makeClient([actor, null]);
    expect(
      await manageUsers(client, 'admin', {
        action: 'create_student',
        fullName: 'Learner',
        email: 'learner@example.com',
      })
    ).toMatchObject({ success: true, userId: 'new-user-id' });
    expect(client.auth.admin.inviteUserByEmail).toHaveBeenCalledWith('learner@example.com', {
      data: { full_name: 'Learner' },
    });
    expect(client.from.mock.results[2].value.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-user-id', role: 'student', admin_role: null }),
      { onConflict: 'id' }
    );
  });
  it('does not recreate an existing account', async () => {
    const { client } = makeClient([actor, student]);
    expect(
      (
        await manageUsers(client, 'admin', {
          action: 'create_student',
          fullName: 'Learner',
          email: 'learner@example.com',
        })
      ).success
    ).toBe(false);
    expect(client.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });
  it('cleans up a newly invited Auth user if profile persistence fails', async () => {
    const { client, state } = makeClient([actor, null]);
    state.profile.error = { message: 'Profile failed' };
    expect(
      (
        await manageUsers(client, 'admin', {
          action: 'create_student',
          fullName: 'Learner',
          email: 'learner@example.com',
        })
      ).success
    ).toBe(false);
    expect(client.auth.admin.deleteUser).toHaveBeenCalledWith('new-user-id');
  });
  it('preserves partial deletion confirmations even if a later request throws', async () => {
    const { client } = makeClient([
      actor,
      student,
      { ...student, id: 'u2' },
      { ...student, id: 'staff', role: 'admin' },
    ]);
    client.auth.admin.deleteUser
      .mockResolvedValueOnce({ error: null })
      .mockRejectedValueOnce(new Error('Network failure'));
    expect(
      await manageUsers(client, 'admin', {
        action: 'delete_students',
        userIds: ['u1', 'u2', 'staff'],
      })
    ).toMatchObject({
      success: false,
      deletedIds: ['u1'],
      failures: [{ userId: 'u2' }, { userId: 'staff' }],
    });
    expect(client.auth.admin.deleteUser).toHaveBeenCalledTimes(2);
  });
  it('never deletes the primary administrator even if its profile role is misconfigured', async () => {
    const { client } = makeClient([actor, { ...student, email: 'admin@practicekoro.online' }]);
    expect(
      (await manageUsers(client, 'admin', { action: 'delete_students', userIds: ['u1'] }))
        .deletedIds
    ).toEqual([]);
    expect(client.auth.admin.deleteUser).not.toHaveBeenCalled();
  });
  it('bans inactive staff in Auth and persists account status', async () => {
    const { client, state } = makeClient([actor, { ...student, role: 'admin' }]);
    expect(
      (
        await manageUsers(client, 'admin', {
          action: 'set_staff_status',
          userId: 'u1',
          status: 'inactive',
        })
      ).success
    ).toBe(true);
    expect(client.auth.admin.updateUserById).toHaveBeenCalledWith('u1', {
      ban_duration: '876000h',
    });
    expect(state.updates[0].account_status).toBe('inactive');
  });
  it('rolls back an Auth ban when the profile update is not confirmed', async () => {
    const { client, state } = makeClient([actor, { ...student, role: 'admin' }]);
    state.saved.data = null as any;
    expect(
      (
        await manageUsers(client, 'admin', {
          action: 'set_staff_status',
          userId: 'u1',
          status: 'inactive',
        })
      ).success
    ).toBe(false);
    expect(client.auth.admin.updateUserById).toHaveBeenLastCalledWith('u1', {
      ban_duration: 'none',
    });
  });
  it('does not silently change only the profile email', async () => {
    const { client, state } = makeClient();
    expect(
      (
        await manageUsers(client, 'admin', {
          action: 'edit_student',
          userId: 'u1',
          updates: { email: 'different@example.com' },
        })
      ).success
    ).toBe(false);
    expect(state.updates).toEqual([]);
  });
  it('does not accept role escalation fields in an edit request', async () => {
    const { client, state } = makeClient();
    await manageUsers(client, 'admin', {
      action: 'edit_student',
      userId: 'u1',
      updates: { fullName: 'Name', role: 'admin', admin_role: 'super_admin' },
    });
    expect(state.updates[0]).not.toHaveProperty('role');
    expect(state.updates[0]).not.toHaveProperty('admin_role');
  });
});
