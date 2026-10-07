import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import {
  AdminDataBoundary,
  AdminPageSkeleton,
  AdminSectionSkeleton,
  AdminRouteSkeleton,
  AppRouteLoadingFallback,
  withAdminSkeleton,
} from './AdminSkeleton';
import { AdminLayout } from '@/components/layout/AdminLayout';
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'admin', name: 'Admin', fullName: 'Admin', email: 'admin@example.test' },
    logout: vi.fn(),
    adminRole: 'super_admin',
    hasPermission: () => true,
  }),
}));
vi.mock('@/context/MaintenanceContext', () => ({
  useMaintenance: () => ({ isMaintenanceMode: false }),
}));
vi.mock('@/components/common/ThemeToggle', () => ({ ThemeToggle: () => null }));
describe('Admin Skeleton regions', () => {
  it.each(['table', 'dashboard', 'cards', 'form', 'detail'] as const)(
    'renders accessible %s layout without fabricated data or actionable placeholders',
    (variant) => {
      const { container } = render(
        <AdminPageSkeleton variant={variant} label="Loading fixtures…" />
      );
      expect(screen.getByRole('status')).toHaveAccessibleName('Loading fixtures…');
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
      expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(8);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    }
  );
  it.each(['list', 'table', 'form'] as const)('renders scoped %s placeholders', (variant) => {
    render(<AdminSectionSkeleton variant={variant} label="Loading details…" />);
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading details…');
  });
  it('only shows the initial skeleton while pending, then preserves empty/error states', () => {
    const { rerender } = render(
      <AdminDataBoundary loading label="Loading records…">
        <p>No records.</p>
      </AdminDataBoundary>
    );
    expect(screen.queryByText('No records.')).not.toBeInTheDocument();
    rerender(
      <AdminDataBoundary loading={false} label="Loading records…">
        <p>No records.</p>
      </AdminDataBoundary>
    );
    expect(screen.getByText('No records.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    rerender(
      <AdminDataBoundary loading={false} label="Loading records…">
        <p role="alert">Permission denied.</p>
      </AdminDataBoundary>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Permission denied.');
  });
  it('does not unmount an edited form during background refresh', () => {
    function Form() {
      const [v, set] = useState('');
      return <input aria-label="Draft" value={v} onChange={(e) => set(e.target.value)} />;
    }
    const { rerender } = render(
      <AdminDataBoundary loading={false} label="Refreshing…">
        <Form />
      </AdminDataBoundary>
    );
    fireEvent.change(screen.getByLabelText('Draft'), { target: { value: 'unsaved' } });
    rerender(
      <AdminDataBoundary loading label="Refreshing…">
        <Form />
      </AdminDataBoundary>
    );
    expect(screen.getByLabelText('Draft')).toHaveValue('unsaved');
    expect(screen.getByRole('status')).toHaveAccessibleName('Refreshing…');
    rerender(
      <AdminDataBoundary loading={false} label="Refreshing…">
        <Form />
      </AdminDataBoundary>
    );
    expect(screen.getByLabelText('Draft')).toHaveValue('unsaved');
  });

  it('can replace a reporting data region on refresh without hiding its external controls', () => {
    const view = (loading: boolean) => (
      <>
        <button>Reporting period</button>
        <AdminDataBoundary
          loading={loading}
          preserveContent={false}
          showHeader={false}
          label="Loading report…"
        >
          <p>Old report</p>
        </AdminDataBoundary>
      </>
    );
    const { rerender } = render(view(false));
    expect(screen.getByText('Old report')).toBeInTheDocument();
    rerender(view(true));
    expect(screen.getByRole('button', { name: 'Reporting period' })).toBeInTheDocument();
    expect(screen.queryByText('Old report')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading report…');
  });
  it.each([
    ['/admin', 'dashboard'],
    ['/admin/settings', 'form'],
    ['/admin/subscription-plans', 'cards'],
    ['/admin/test-questions', 'detail'],
    ['/admin/students', 'table'],
    ['/admin/analytics', 'dashboard'],
  ])('uses matching route layout for %s', (path, variant) => {
    const { container } = render(
      <MemoryRouter initialEntries={[path]}>
        <AdminRouteSkeleton />
      </MemoryRouter>
    );
    expect(container.querySelector('[data-slot="admin-page-skeleton"]')).toHaveAttribute(
      'data-variant',
      variant
    );
  });
  it('retains public/student fallback and uses skeleton only for admin', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/practice']}>
        <AppRouteLoadingFallback />
      </MemoryRouter>
    );
    expect(screen.getByLabelText('Loading page')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    unmount();
    render(
      <MemoryRouter initialEntries={['/admin/subjects']}>
        <AppRouteLoadingFallback />
      </MemoryRouter>
    );
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading admin page…');
  });
  it('supports the page helper without changing loading semantics', () => {
    render(withAdminSkeleton(true, <p>Hidden data</p>, { label: 'Loading page records…' }));
    expect(screen.queryByText('Hidden data')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  it('keeps admin navigation mounted while a lazy child resolves', async () => {
    let release!: () => void;
    const promise = new Promise<void>((r) => (release = r));
    let ready = false;
    function Pending() {
      if (!ready) throw promise;
      return <p>Loaded route content</p>;
    }
    render(
      <MemoryRouter initialEntries={['/admin/students']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="students" element={<Pending />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading admin page…');
    expect(screen.getAllByText('Students').length).toBeGreaterThan(0);
    ready = true;
    release();
    await waitFor(() => expect(screen.getByText('Loaded route content')).toBeInTheDocument());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
