vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
  supabaseRuntime: {},
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdminPermissions } from '@/types';
import {
  logAdminActivity,
  getAdminAuditLogs,
  exportAuditLogsToCsv,
  getStaffMembers,
  updateStaffRole,
  assignStaffByEmail,
  removeStaffMember,
} from './auditLog';
import { localAuditLogs } from './localStore';

describe('Admin Roles & RBAC Permission Matrix', () => {
  it('gives super_admin complete access across all 11 administrative privileges', () => {
    const permissions = getAdminPermissions('super_admin');
    expect(permissions.canManageQuestions).toBe(true);
    expect(permissions.canManageTests).toBe(true);
    expect(permissions.canDeleteTests).toBe(true);
    expect(permissions.canManageExams).toBe(true);
    expect(permissions.canManageSubscriptions).toBe(true);
    expect(permissions.canManageCoupons).toBe(true);
    expect(permissions.canManageSupport).toBe(true);
    expect(permissions.canManageNotifications).toBe(true);
    expect(permissions.canManageSettings).toBe(true);
    expect(permissions.canManageStaff).toBe(true);
    expect(permissions.canViewAuditLogs).toBe(true);
  });

  it('denies all permissions when role is not specified', () => {
    const permissions = getAdminPermissions(undefined);
    expect(Object.values(permissions).every((value) => value === false)).toBe(true);
  });

  it('restricts content_writer from destructive deletions, billing, settings, and staff management', () => {
    const permissions = getAdminPermissions('content_writer');
    expect(permissions.canManageQuestions).toBe(true);
    expect(permissions.canManageTests).toBe(true);
    expect(permissions.canManageExams).toBe(true);

    expect(permissions.canDeleteTests).toBe(false);
    expect(permissions.canManageSubscriptions).toBe(false);
    expect(permissions.canManageCoupons).toBe(false);
    expect(permissions.canManageSettings).toBe(false);
    expect(permissions.canManageStaff).toBe(false);
    expect(permissions.canViewAuditLogs).toBe(false);
    expect(permissions.canManageSupport).toBe(false);
  });

  it('restricts support_agent to support tickets and notifications only', () => {
    const permissions = getAdminPermissions('support_agent');
    expect(permissions.canManageSupport).toBe(true);
    expect(permissions.canManageNotifications).toBe(true);

    expect(permissions.canManageQuestions).toBe(false);
    expect(permissions.canManageTests).toBe(false);
    expect(permissions.canDeleteTests).toBe(false);
    expect(permissions.canManageExams).toBe(false);
    expect(permissions.canManageSubscriptions).toBe(false);
    expect(permissions.canManageCoupons).toBe(false);
    expect(permissions.canManageSettings).toBe(false);
    expect(permissions.canManageStaff).toBe(false);
    expect(permissions.canViewAuditLogs).toBe(false);
  });
});

describe('Admin Activity Audit Trail Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records an admin action in the audit logs with full attribution metadata', async () => {
    const initialCount = localAuditLogs.length;

    await logAdminActivity({
      action: 'TEST_DELETE',
      entityType: 'test',
      entityId: 'test_wbcs_01',
      entityName: 'WBCS Prelims 2026 Mock Test 1',
      details: { totalQuestions: 100, examSlug: 'wbcs-prelims' },
      adminUser: {
        id: 'usr_super_1',
        fullName: 'Susanta Lohar',
        email: 'admin@practicekoro.online',
        role: 'admin',
        adminRole: 'super_admin',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });

    expect(localAuditLogs.length).toBe(initialCount + 1);
    const latest = localAuditLogs[0];
    expect(latest.action).toBe('TEST_DELETE');
    expect(latest.entityType).toBe('test');
    expect(latest.entityName).toBe('WBCS Prelims 2026 Mock Test 1');
    expect(latest.adminEmail).toBe('admin@practicekoro.online');
    expect(latest.adminRole).toBe('super_admin');
    expect(latest.details?.totalQuestions).toBe(100);
  });

  it('retrieves and filters audit logs by action type, entity type, and search keyword', async () => {
    await logAdminActivity({
      action: 'SUBSCRIPTION_MANUAL_GRANT',
      entityType: 'subscription',
      entityId: 'sub_grant_99',
      entityName: 'Rahul Banerjee',
      details: { plan: '1-Year Pro', durationDays: 365 },
      adminUser: {
        id: 'usr_super_1',
        fullName: 'Super Admin',
        email: 'owner@practicekoro.online',
        role: 'admin',
        adminRole: 'super_admin',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });

    const resActionFilter = await getAdminAuditLogs({ action: 'SUBSCRIPTION_MANUAL_GRANT' });
    expect(resActionFilter.logs.length).toBeGreaterThan(0);
    expect(resActionFilter.logs.every((l) => l.action === 'SUBSCRIPTION_MANUAL_GRANT')).toBe(true);

    const resSearchFilter = await getAdminAuditLogs({ search: 'Rahul Banerjee' });
    expect(resSearchFilter.logs.length).toBeGreaterThan(0);
    expect(resSearchFilter.logs[0].entityName).toContain('Rahul Banerjee');
  });

  it('exports audit logs to CSV with trigger download', () => {
    const mockClick = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName === 'a') {
        el.click = mockClick;
      }
      return el;
    });

    const mockLogs = [
      {
        id: 'log_test_1',
        adminEmail: 'writer@practicekoro.online',
        adminName: 'অঙ্কুর সেনগুপ্ত',
        adminRole: 'content_writer' as const,
        action: 'QUESTION_CREATE',
        entityType: 'question',
        entityName: 'মুঘল সাম্রাজ্যের প্রতিষ্ঠাতা কে ছিলেন?',
        details: { subject: 'History', correctOption: 'A' },
        createdAt: new Date().toISOString(),
      },
    ];

    exportAuditLogsToCsv(mockLogs);
    expect(mockClick).toHaveBeenCalled();
  });
});

describe('Staff User Management & Sub-Role Assignment', () => {
  it('retrieves existing staff users and updates their sub-role', async () => {
    const staff = await getStaffMembers();
    expect(Array.isArray(staff)).toBe(true);
    expect(staff.length).toBeGreaterThan(0);

    const targetStaff = staff[0];
    const newRole = targetStaff.adminRole === 'content_writer' ? 'support_agent' : 'content_writer';

    const updateRes = await updateStaffRole(targetStaff.id, newRole, {
      id: 'super_admin_id',
      email: 'owner@practicekoro.online',
      fullName: 'Super Admin',
      role: 'admin',
      adminRole: 'super_admin',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(updateRes.success).toBe(true);
    const updatedStaff = await getStaffMembers();
    const found = updatedStaff.find((s) => s.id === targetStaff.id);
    expect(found?.adminRole).toBe(newRole);
  });

  it('assigns staff role to a user by email', async () => {
    const testEmail = 'newwriter@practicekoro.online';
    const assignRes = await assignStaffByEmail(testEmail, 'content_writer', {
      id: 'super_admin_id',
      email: 'owner@practicekoro.online',
      fullName: 'Super Admin',
      role: 'admin',
      adminRole: 'super_admin',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(assignRes.success).toBe(true);
    const staff = await getStaffMembers();
    const found = staff.find((s) => s.email.toLowerCase() === testEmail.toLowerCase());
    expect(found).toBeDefined();
    expect(found?.adminRole).toBe('content_writer');

    // Demote staff member back to regular student
    if (found) {
      const removeRes = await removeStaffMember(found.id, {
        id: 'super_admin_id',
        email: 'owner@practicekoro.online',
        fullName: 'Super Admin',
        role: 'admin',
        adminRole: 'super_admin',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      expect(removeRes.success).toBe(true);

      const updatedStaff = await getStaffMembers();
      expect(updatedStaff.find((s) => s.id === found.id)).toBeUndefined();
    }
  });
});
