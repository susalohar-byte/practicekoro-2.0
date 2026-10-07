// Pure, dependency-injected handler: service-role credentials stay in the Edge Function.
export type ManagementResult = {
  success: boolean;
  error?: string;
  userId?: string;
  deletedIds?: string[];
  failures?: { userId: string; error: string }[];
};
const safeText = (value: unknown, max = 200): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';
export async function manageUsers(
  client: any,
  actorId: string,
  input: any
): Promise<ManagementResult> {
  const { data: actor, error: actorError } = await client
    .from('profiles')
    .select('id, role, admin_role, account_status')
    .eq('id', actorId)
    .maybeSingle();
  if (
    actorError ||
    actor?.role !== 'admin' ||
    actor?.admin_role !== 'super_admin' ||
    actor?.account_status !== 'active'
  ) {
    return { success: false, error: 'Active Super Admin privileges are required.' };
  }
  const action = input?.action;
  if (
    ![
      'create_student',
      'edit_student',
      'delete_students',
      'set_student_status',
      'set_staff_status',
    ].includes(action)
  ) {
    return { success: false, error: 'Unsupported management action.' };
  }
  try {
    if (action === 'create_student') {
      const email = safeText(input.email, 254).toLowerCase();
      const fullName = safeText(input.fullName);
      if (email === 'admin@practicekoro.online')
        return { success: false, error: 'The platform administrator account is protected.' };
      if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return { success: false, error: 'A valid name and email are required.' };
      const { data: existing, error: lookupError } = await client
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (lookupError) throw new Error(lookupError.message);
      if (existing) return { success: false, error: 'An account with this email already exists.' };
      const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
      });
      if (error || !data?.user?.id)
        return { success: false, error: error?.message || 'Account invitation failed.' };
      const userId = data.user.id;
      let profileError;
      try {
        const savedProfile = await client.from('profiles').upsert(
          {
            id: userId,
            full_name: fullName,
            email,
            phone: safeText(input.phone, 30) || null,
            role: 'student',
            admin_role: null,
            account_status: 'active',
            target_exam_title: safeText(input.targetExam) || null,
            district: safeText(input.district) || null,
          },
          { onConflict: 'id' }
        );
        profileError = savedProfile.error;
      } catch (err) {
        profileError = { message: err instanceof Error ? err.message : 'Profile save failed.' };
      }
      if (profileError) {
        try {
          const cleanup = await client.auth.admin.deleteUser(userId);
          return {
            success: false,
            error: cleanup.error
              ? 'Profile save failed; account cleanup also failed. Manual reconciliation is required.'
              : profileError.message,
          };
        } catch {
          return {
            success: false,
            error:
              'Profile save failed; account cleanup also failed. Manual reconciliation is required.',
          };
        }
      }
      return { success: true, userId };
    }
    if (action === 'delete_students') {
      const ids = Array.isArray(input.userIds) ? [...new Set(input.userIds)] : [];
      if (!ids.length || ids.length > 100 || ids.some((id) => typeof id !== 'string' || !id)) {
        return { success: false, error: 'Provide 1–100 student IDs.' };
      }
      const deletedIds: string[] = [];
      const failures: { userId: string; error: string }[] = [];
      for (const userId of ids as string[]) {
        try {
          const { data: target, error } = await client
            .from('profiles')
            .select('id, role, email')
            .eq('id', userId)
            .maybeSingle();
          if (
            error ||
            target?.role !== 'student' ||
            userId === actorId ||
            String(target.email).toLowerCase() === 'admin@practicekoro.online'
          ) {
            failures.push({
              userId,
              error: error?.message || 'Student account not found or protected.',
            });
            continue;
          }
          const removed = await client.auth.admin.deleteUser(userId);
          if (removed.error) failures.push({ userId, error: removed.error.message });
          else deletedIds.push(userId);
        } catch (err) {
          failures.push({ userId, error: err instanceof Error ? err.message : 'Deletion failed.' });
        }
      }
      return {
        success: failures.length === 0,
        deletedIds,
        failures,
        error: failures.length
          ? `${failures.length} student account(s) could not be deleted.`
          : undefined,
      };
    }
    const userId = safeText(input.userId, 100);
    const { data: target, error } = await client
      .from('profiles')
      .select('id, role, email, account_status')
      .eq('id', userId)
      .maybeSingle();
    const targetRole = action === 'set_staff_status' ? 'admin' : 'student';
    if (
      error ||
      !target ||
      target.role !== targetRole ||
      userId === actorId ||
      String(target.email).toLowerCase() === 'admin@practicekoro.online'
    ) {
      return { success: false, error: error?.message || 'Target account is missing or protected.' };
    }
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const updates = input.updates || {};
    if (action === 'edit_student') {
      if (updates.fullName !== undefined) {
        if (!safeText(updates.fullName)) return { success: false, error: 'Name cannot be empty.' };
        payload.full_name = safeText(updates.fullName);
      }
      if (updates.phone !== undefined) payload.phone = safeText(updates.phone, 30) || null;
      if (updates.targetExam !== undefined)
        payload.target_exam_title = safeText(updates.targetExam) || null;
      if (updates.district !== undefined) payload.district = safeText(updates.district) || null;
      // Auth email changes need a separate verified flow; never silently change only profiles.email.
      if (
        updates.email !== undefined &&
        safeText(updates.email).toLowerCase() !== String(target.email).toLowerCase()
      ) {
        return {
          success: false,
          error: 'Email changes require the verified account email-change flow.',
        };
      }
    }
    const requestedStatus = action === 'edit_student' ? updates.status : input.status;
    let changedBan = false;
    if (requestedStatus !== undefined) {
      const status = String(requestedStatus).toLowerCase();
      if (!['active', 'inactive'].includes(status))
        return { success: false, error: 'Invalid account status.' };
      const banned = await client.auth.admin.updateUserById(userId, {
        ban_duration: status === 'inactive' ? '876000h' : 'none',
      });
      if (banned.error) return { success: false, error: banned.error.message };
      changedBan = true;
      payload.account_status = status;
    }
    let saved;
    try {
      saved = await client
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select('id')
        .maybeSingle();
    } catch (err) {
      saved = {
        data: null,
        error: { message: err instanceof Error ? err.message : 'Profile save failed.' },
      };
    }
    if (saved.error || saved.data?.id !== userId) {
      if (changedBan) {
        const rollback = await client.auth.admin.updateUserById(userId, {
          ban_duration: target.account_status === 'inactive' ? '876000h' : 'none',
        });
        if (rollback.error)
          return {
            success: false,
            error: 'Status save and rollback failed. Manual reconciliation is required.',
          };
      }
      return { success: false, error: saved.error?.message || 'No account was updated.' };
    }
    return { success: true, userId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Account operation failed.',
    };
  }
}
