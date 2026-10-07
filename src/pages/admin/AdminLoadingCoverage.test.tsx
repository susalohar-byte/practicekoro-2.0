import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
const pending = vi.hoisted(() => new Promise(() => {}));
vi.mock('@/services/api', () => ({
  api: new Proxy(
    {},
    {
      get: (_target, key) => (String(key).startsWith('subscribe') ? () => () => {} : () => pending),
    }
  ),
}));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, supabaseRuntime: {} }));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin', name: 'Admin', email: 'admin@example.test' },
    isAdmin: true,
    adminRole: 'super_admin',
    hasPermission: () => true,
  }),
}));
vi.mock('@/context/MaintenanceContext', () => ({
  useMaintenance: () => ({ isMaintenanceMode: false, refreshSettings: vi.fn(), settings: {} }),
  useContentLanguage: () => ({ contentLanguage: 'en' }),
}));
const pages = import.meta.glob('./Admin*.tsx');
const names = [
  'AdminDashboard',
  'AdminExams',
  'AdminBanners',
  'AdminTestSeries',
  'AdminTests',
  'AdminTestQuestions',
  'AdminSubjects',
  'AdminTopics',
  'AdminStudents',
  'AdminTestAttempts',
  'AdminRankings',
  'AdminDistrictRankings',
  'AdminPerformance',
  'AdminCutoff',
  'AdminPayments',
  'AdminSubscriptions',
  'AdminSubscriptionPlans',
  'AdminQuestionBank',
  'AdminNotifications',
  'AdminSupport',
  'AdminStaff',
  'AdminAuditLogs',
  'AdminSettings',
  'AdminCoupons',
  'AdminAnalytics',
  'AdminLiveTests',
  'AdminBlog',
  'AdminExamTopics',
  'AdminTopicManage',
  'AdminItemAnalysis',
  'AdminRevenueAnalytics',
];
describe('All admin data-loading screens', () => {
  it.each(names)(
    '%s renders an initial accessible Skeleton while real reads are pending',
    async (name) => {
      const module = (await pages[`./${name}.tsx`]()) as Record<string, React.ComponentType>;
      const Page = module[name];
      render(
        <MemoryRouter initialEntries={['/admin/test-questions/test-1']}>
          <QueryClientProvider client={new QueryClient()}>
            <Routes>
              <Route path="/admin/test-questions/:testId" element={<Page />} />
            </Routes>
          </QueryClientProvider>
        </MemoryRouter>
      );
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
      expect(document.querySelector('[data-slot="admin-page-skeleton"]')).not.toBeNull();
      expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(8);
    }
  );
  it('keeps the workspace selector loading while its tests list is pending without a test ID', async () => {
    const module = (await pages['./AdminTestQuestions.tsx']()) as Record<
      string,
      React.ComponentType
    >;
    const Page = module.AdminTestQuestions;
    render(
      <MemoryRouter initialEntries={['/admin/test-questions']}>
        <Page />
      </MemoryRouter>
    );
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading Test Workspace');
  });
});
