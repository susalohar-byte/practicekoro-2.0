import { adminCommerceApi } from './adminCommerce';
import { loadAllPages } from '@/utils/loadAllPages';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AdminStudentRow } from '@/types';
export async function enrichStudentAccountStatus(
  rows: AdminStudentRow[]
): Promise<AdminStudentRow[]> {
  if (!isSupabaseConfigured || !rows.length) return rows;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, account_status, target_exam_title, district')
    .in(
      'id',
      rows.map((r) => r.id)
    );
  if (error) throw new Error(`Account status could not be loaded: ${error.message}`);
  const profiles = new Map((data || []).map((r) => [r.id, r]));
  return rows.map((row) => ({
    ...row,
    accountStatus: profiles.get(row.id)?.account_status,
    targetExamTitle: profiles.get(row.id)?.target_exam_title || row.targetExamTitle,
    district: profiles.get(row.id)?.district || row.district,
  }));
}
export const adminRecordsApi = {
  getAllAdminPayments() {
    return loadAllPages((limit, offset) =>
      adminCommerceApi.getAdminPayments(undefined, undefined, limit, offset)
    );
  },
  getAllAdminSubscriptions() {
    return loadAllPages((limit, offset) =>
      adminCommerceApi.getAdminSubscriptions(undefined, undefined, limit, offset)
    );
  },
  getAllAdminStudents() {
    return loadAllPages(async (limit, offset) =>
      enrichStudentAccountStatus(
        await adminCommerceApi.getAdminStudents(undefined, undefined, undefined, limit, offset)
      )
    );
  },
};
