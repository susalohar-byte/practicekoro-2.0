import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
export type AccountOperationResult = {
  success: boolean;
  error?: string;
  userId?: string;
  deletedIds?: string[];
  failures?: { userId: string; error: string }[];
};
async function invokeManagement(body: Record<string, unknown>): Promise<AccountOperationResult> {
  if (!isSupabaseConfigured)
    return { success: false, error: 'Account management requires a configured backend.' };
  try {
    const { data, error } = await supabase.functions.invoke('admin-manage-users', { body });
    if (error) {
      let message = error.message;
      try {
        const detail = await error.context?.json();
        if (detail?.error) message = detail.error;
      } catch {
        /* retain transport error */
      }
      return { success: false, error: message };
    }
    if (!data || typeof data.success !== 'boolean')
      return { success: false, error: 'Invalid account-management response.' };
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Account operation failed.',
    };
  }
}
export const accountManagementApi = {
  createStudentAccount(input: {
    fullName: string;
    email: string;
    phone?: string;
    targetExam?: string;
    district?: string;
  }) {
    return invokeManagement({ action: 'create_student', ...input });
  },
  updateStudentProfile(
    userId: string,
    updates: {
      fullName?: string;
      email?: string;
      phone?: string;
      targetExam?: string;
      district?: string;
      status?: string;
    }
  ) {
    return invokeManagement({ action: 'edit_student', userId, updates });
  },
  deleteStudentProfile(userId: string) {
    return invokeManagement({ action: 'delete_students', userIds: [userId] });
  },
  async bulkDeleteStudentProfiles(userIds: string[]): Promise<AccountOperationResult> {
    const deletedIds: string[] = [];
    const failures: { userId: string; error: string }[] = [];
    const ids = [...new Set(userIds)];
    for (let offset = 0; offset < ids.length; offset += 100) {
      const batch = ids.slice(offset, offset + 100);
      const result = await invokeManagement({ action: 'delete_students', userIds: batch });
      const confirmed = (result.deletedIds || []).filter((id) => batch.includes(id));
      deletedIds.push(...confirmed);
      for (const userId of batch.filter((id) => !confirmed.includes(id))) {
        failures.push({
          userId,
          error:
            result.failures?.find((f) => f.userId === userId)?.error ||
            result.error ||
            'Deletion not confirmed.',
        });
      }
    }
    return {
      success: failures.length === 0,
      deletedIds,
      failures,
      error: failures.length ? `${failures.length} deletion(s) were not confirmed.` : undefined,
    };
  },
  setStaffAccountStatus(userId: string, status: 'active' | 'inactive') {
    return invokeManagement({ action: 'set_staff_status', userId, status });
  },
};
