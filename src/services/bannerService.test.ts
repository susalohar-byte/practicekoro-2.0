import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
  supabaseRuntime: {},
}));

import { bannerService } from './bannerService';

describe('bannerService Enterprise Architecture', () => {
  beforeEach(async () => {
    localStorage.clear();
  });

  it('starts empty with no demo banners injected', async () => {
    const banners = await bannerService.getBanners();
    expect(banners).toEqual([]);
    const active = await bannerService.getActiveBanners();
    expect(active).toEqual([]);
  });

  describe('Audience Targeting', () => {
    beforeEach(async () => {
      // Create custom banners with distinct audiences
      await bannerService.createBanner({
        title: 'Free Only Special Offer',
        primaryCtaLink: '/subscription',
        imageUrl: '/images/promo.png',
        targetAudience: 'free',
        isActive: true,
        displayOrder: 10,
      });

      await bannerService.createBanner({
        title: 'Pro Only Live Marathon Mock',
        primaryCtaLink: '/exams',
        imageUrl: '/images/pro-mock.png',
        targetAudience: 'pro',
        isActive: true,
        displayOrder: 11,
      });
    });

    it('returns all + free banners for free candidates, excluding pro-only banners', async () => {
      const activeForFree = await bannerService.getActiveBanners({ audience: 'free' });
      const titles = activeForFree.map((b) => b.title);
      expect(titles).toContain('Free Only Special Offer');
      expect(titles).not.toContain('Pro Only Live Marathon Mock');
    });

    it('returns all + pro banners for pro candidates, excluding free-only banners', async () => {
      const activeForPro = await bannerService.getActiveBanners({ audience: 'pro' });
      const titles = activeForPro.map((b) => b.title);
      expect(titles).toContain('Pro Only Live Marathon Mock');
      expect(titles).not.toContain('Free Only Special Offer');
    });

    it('returns all audience banners when audience is all or unspecified', async () => {
      const activeAll = await bannerService.getActiveBanners();
      expect(activeAll.length).toBeGreaterThan(0);
    });
  });

  describe('Campaign Scheduling', () => {
    it('excludes expired campaigns from active banners', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await bannerService.createBanner({
        title: 'Flash Sale (Expired)',
        primaryCtaLink: '/subscription',
        imageUrl: '/images/expired.png',
        expiresAt: yesterday,
        isActive: true,
        displayOrder: 20,
      });

      const active = await bannerService.getActiveBanners();
      const expired = active.find((b) => b.title === 'Flash Sale (Expired)');
      expect(expired).toBeUndefined();
    });

    it('excludes future scheduled campaigns that have not started yet', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await bannerService.createBanner({
        title: 'Future New Year Special',
        primaryCtaLink: '/exams',
        imageUrl: '/images/future.png',
        startsAt: tomorrow,
        isActive: true,
        displayOrder: 21,
      });

      const active = await bannerService.getActiveBanners();
      const future = active.find((b) => b.title === 'Future New Year Special');
      expect(future).toBeUndefined();
    });

    it('includes active campaigns within the valid date window', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await bannerService.createBanner({
        title: 'Live Weekend Bonanza',
        primaryCtaLink: '/exams',
        imageUrl: '/images/live.png',
        startsAt: yesterday,
        expiresAt: tomorrow,
        isActive: true,
        displayOrder: 22,
      });

      const active = await bannerService.getActiveBanners();
      const live = active.find((b) => b.title === 'Live Weekend Bonanza');
      expect(live).toBeDefined();
    });
  });

  describe('Analytics & Click Tracking', () => {
    it('increments clickCount on banner click tracking', async () => {
      const banner = await bannerService.createBanner({
        title: 'Click Tracker Test Banner',
        primaryCtaLink: '/exams',
        imageUrl: '/images/test.png',
        clickCount: 5,
        isActive: true,
        displayOrder: 30,
      });

      await bannerService.trackBannerClick(banner.id);
      await bannerService.trackBannerClick(banner.id);

      const all = await bannerService.getBanners();
      const found = all.find((b) => b.id === banner.id);
      expect(found?.clickCount).toBe(7);
    });
  });

  describe('Reordering & CRUD', () => {
    it('allows updating banner properties and active status', async () => {
      const banner = await bannerService.createBanner({
        title: 'Original Title',
        primaryCtaLink: '/exams',
        imageUrl: '/images/test.png',
        isActive: true,
        displayOrder: 40,
      });

      const updated = await bannerService.updateBanner(banner.id, {
        title: 'Updated Title',
        primaryCtaLink: '/subscription',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.primaryCtaLink).toBe('/subscription');

      await bannerService.toggleBannerStatus(banner.id, false);
      const active = await bannerService.getActiveBanners();
      expect(active.find((b) => b.id === banner.id)).toBeUndefined();
    });

    it('reorders banners by given ID array', async () => {
      const first = await bannerService.createBanner({
        title: 'First Banner',
        primaryCtaLink: '/exams',
        imageUrl: '/images/a.png',
        isActive: true,
        displayOrder: 1,
      });
      const second = await bannerService.createBanner({
        title: 'Second Banner',
        primaryCtaLink: '/exams',
        imageUrl: '/images/b.png',
        isActive: true,
        displayOrder: 2,
      });

      await bannerService.reorderBanners([second.id, first.id]);
      const reordered = await bannerService.getBanners();

      expect(reordered[0].id).toBe(second.id);
      expect(reordered[0].displayOrder).toBe(1);
      expect(reordered[1].id).toBe(first.id);
      expect(reordered[1].displayOrder).toBe(2);
    });

    it('supports syncToRemote explicitly', async () => {
      await bannerService.createBanner({
        title: 'Sync Probe Banner',
        primaryCtaLink: '/exams',
        imageUrl: '/images/sync.png',
        isActive: true,
        displayOrder: 1,
      });
      const res = await bannerService.syncToRemote();
      expect(res.success).toBe(true);
      expect(res.count).toBe(1);
    });

    it('filters by placement properly and falls back to home_hero', async () => {
      await bannerService.createBanner({
        title: 'Catalog Only Banner',
        primaryCtaLink: '/exams',
        imageUrl: '/images/cat.png',
        placement: 'catalog',
        isActive: true,
        displayOrder: 50,
      });

      const homeBanners = await bannerService.getActiveBanners({ placement: 'home_hero' });
      const titles = homeBanners.map((b) => b.title);
      expect(titles).not.toContain('Catalog Only Banner');
    });

    it('guarantees admin active banners are shown as resilient fallback if audience filter yields empty', async () => {
      localStorage.clear();
      // Only 1 active banner with 'pro' audience
      await bannerService.createBanner({
        title: 'Exclusive Pro Marathon',
        primaryCtaLink: '/exams',
        imageUrl: '/images/pro.png',
        targetAudience: 'pro',
        isActive: true,
        displayOrder: 1,
      });

      // Free user query: normally would filter out 'pro' banner, but fallback ensures active banner is displayed
      const bannersForFree = await bannerService.getActiveBanners({ audience: 'free' });
      expect(bannersForFree.length).toBeGreaterThan(0);
      expect(bannersForFree[0].title).toBe('Exclusive Pro Marathon');
    });
  });
});
