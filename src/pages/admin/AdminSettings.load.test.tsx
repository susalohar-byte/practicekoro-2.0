import { beforeEach, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
const mocks = vi.hoisted(() => ({
  settings: vi.fn(),
  gateway: vi.fn(),
  update: vi.fn(),
  log: vi.fn(),
}));
vi.mock('@/services/api', () => ({
  api: {
    getAppSettings: mocks.settings,
    getPaymentGatewayConfig: mocks.gateway,
    updateAppSettings: mocks.update,
    logAdminActivity: mocks.log,
  },
}));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/context/MaintenanceContext', () => ({
  useMaintenance: () => ({ checkMaintenanceMode: vi.fn() }),
}));
vi.mock('@/services/domains/admin.questions', () => ({ uploadQuestionImage: vi.fn() }));
import { AdminSettings } from './AdminSettings';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.settings.mockResolvedValue([
    { id: 'general_app_name', key: 'app_name', value: 'Saved Platform' },
    { id: 'general_support_email', key: 'support_email', value: 'saved-support@example.test' },
    { id: 'general_admin_email', key: 'admin_email', value: 'saved-admin@example.test' },
  ]);
  mocks.gateway.mockResolvedValue({ keyId: '', isActive: false });
  mocks.update.mockResolvedValue({ success: true });
});
it('hides editable defaults while the authoritative load is pending', async () => {
  mocks.settings.mockImplementation(() => new Promise(() => {}));
  render(<AdminSettings />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading saved settings');
  expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
});
it('blocks editing on load error and retries before showing actual saved values', async () => {
  mocks.settings.mockRejectedValueOnce(new Error('permission denied'));
  render(<AdminSettings />);
  expect(await screen.findByRole('alert')).toHaveTextContent('permission denied');
  expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry settings load' }));
  expect(await screen.findByDisplayValue('Saved Platform')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(mocks.update).not.toHaveBeenCalled();
});
it('also blocks editable defaults if gateway loading fails', async () => {
  mocks.gateway.mockRejectedValueOnce(new Error('gateway denied'));
  render(<AdminSettings />);
  expect(await screen.findByRole('alert')).toHaveTextContent('gateway denied');
  expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
});
it('saves the loaded support and admin emails separately, not a default admin email over support', async () => {
  render(<AdminSettings />);
  await screen.findByDisplayValue('saved-support@example.test');
  fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalled());
  expect(mocks.update.mock.calls[0][0]).toEqual(
    expect.arrayContaining([
      { id: 'general_support_email', value: 'saved-support@example.test' },
      { id: 'general_admin_email', value: 'saved-admin@example.test' },
    ])
  );
});
