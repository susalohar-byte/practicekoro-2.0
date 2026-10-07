import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  data: {} as Record<string, any[]>,
  errors: {} as Record<string, string>,
  calls: [] as any[],
}));
vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabaseRuntime: {
    from: (table: string) => {
      const filters: ((r: any) => boolean)[] = [];
      let lo = 0,
        hi = Infinity,
        head = false;
      const q: any = {
        select: (columns: string, opt: any = {}) => {
          head = Boolean(opt.head);
          m.calls.push({ table, columns, head });
          return q;
        },
        order: () => q,
        range: (a: number, b: number) => {
          lo = a;
          hi = b;
          return q;
        },
        limit: (n: number) => {
          hi = n - 1;
          return q;
        },
        eq: (k: string, v: any) => {
          filters.push((r) => r[k] === v);
          return q;
        },
        in: (k: string, v: any[]) => {
          filters.push((r) => v.includes(r[k]));
          return q;
        },
        not: (k: string, _op: string, _v: any) => {
          filters.push((r) => r[k] != null);
          return q;
        },
        gt: (k: string, v: any) => {
          filters.push((r) => r[k] > v);
          return q;
        },
        gte: (k: string, v: any) => {
          filters.push((r) => Date.parse(r[k]) >= Date.parse(v));
          return q;
        },
        lte: (k: string, v: any) => {
          filters.push((r) => Date.parse(r[k]) <= Date.parse(v));
          return q;
        },
        then: (yes: any, no: any) => {
          const all = (m.data[table] || []).filter((r) => filters.every((f) => f(r)));
          // Simulate a server result limit lower than the requested 500, with exact count.
          return Promise.resolve({
            data: head ? null : all.slice(lo, Math.min(hi + 1, lo + 2)),
            count: all.length,
            error: m.errors[table] ? { message: m.errors[table] } : null,
          }).then(yes, no);
        },
      };
      return q;
    },
  },
}));
import { adminCommerceApi } from './adminCommerce';
describe('Complete coupon backend reads', () => {
  beforeEach(() => {
    m.data = {};
    m.errors = {};
    m.calls = [];
  });
  it('fetches every server page with actual coupon IDs and restrictions', async () => {
    m.data.coupons = Array.from({ length: 7 }, (_, i) => ({
      id: `coupon-${i}`,
      code: `C${i}`,
      discount_type: 'fixed',
      discount_value: 10,
      min_order_amount: 299,
      max_uses_per_user: 2,
      is_active: true,
    }));
    const result = await adminCommerceApi.getAdminCoupons();
    expect(result).toHaveLength(7);
    expect(result[6]).toMatchObject({ id: 'coupon-6', minOrderAmount: 299, maxUsesPerUser: 2 });
  });
  it('throws on backend denial instead of returning a misleading empty list', async () => {
    m.errors.coupons = 'permission denied';
    await expect(adminCommerceApi.getAdminCoupons()).rejects.toThrow('permission denied');
  });
});
