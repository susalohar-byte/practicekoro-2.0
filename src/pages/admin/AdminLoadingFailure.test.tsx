import type { ComponentType } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/services/api', () => ({
  api: new Proxy({}, { get: () => () => Promise.reject(new Error('Read denied')) }),
}));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, supabaseRuntime: {} }));
const modules = import.meta.glob('./Admin*.tsx');
describe('Admin load failures leave Skeleton state', () => {
  it.each(['AdminTopics', 'AdminSupport', 'AdminSubscriptionPlans'])(
    '%s finishes its loading placeholder even on failed reads',
    async (name) => {
      const module = (await modules[`./${name}.tsx`]()) as Record<string, ComponentType>;
      const Page = module[name];
      const { container } = render(
        <MemoryRouter>
          <Page />
        </MemoryRouter>
      );
      await waitFor(() =>
        expect(container.querySelector('[data-slot="admin-page-skeleton"]')).toBeNull()
      );
      expect(container.textContent).toContain('Read denied');
    }
  );
});
