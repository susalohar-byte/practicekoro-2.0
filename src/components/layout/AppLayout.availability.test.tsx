import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  loading: true,
  settingsError: '',
  hasLoadedSettings: false,
  isMaintenanceMode: false,
  isAdmin: false,
  retry: vi.fn(),
}));
vi.mock('@/context/MaintenanceContext', () => ({
  useMaintenance: () => ({ ...m, checkMaintenanceMode: m.retry }),
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ isAdmin: m.isAdmin }) }));
vi.mock('react-router-dom', () => ({ Outlet: () => <div>Student content</div> }));
vi.mock('./StudentSidebar', () => ({ StudentSidebar: () => null }));
vi.mock('./StudentNavbar', () => ({ StudentNavbar: () => null }));
vi.mock('./BottomNav', () => ({ BottomNav: () => null }));
vi.mock('@/components/student/MandatoryDistrictModal', () => ({
  MandatoryDistrictModal: () => null,
}));
vi.mock('@/components/common/MaintenanceScreen', () => ({
  MaintenanceScreen: () => <div>Maintenance</div>,
}));
import { AppLayout } from './AppLayout';
beforeEach(() => {
  cleanup();
  Object.assign(m, {
    loading: true,
    settingsError: '',
    hasLoadedSettings: false,
    isMaintenanceMode: false,
    isAdmin: false,
  });
  m.retry.mockResolvedValue(false);
});
it('does not flash student content before availability is known', () => {
  render(<AppLayout />);
  expect(screen.queryByText('Student content')).not.toBeInTheDocument();
});
it('shows retry after an initial settings failure', () => {
  Object.assign(m, { loading: false, settingsError: 'offline' });
  render(<AppLayout />);
  fireEvent.click(screen.getByRole('button', { name: /retry/i }));
  expect(m.retry).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Student content')).not.toBeInTheDocument();
});
it('does not lock admins out of maintenance recovery', () => {
  m.isAdmin = true;
  render(<AppLayout />);
  expect(screen.getByText('Student content')).toBeInTheDocument();
});
it('honors confirmed maintenance', () => {
  Object.assign(m, { loading: false, hasLoadedSettings: true, isMaintenanceMode: true });
  render(<AppLayout />);
  expect(screen.getByText('Maintenance')).toBeInTheDocument();
});
