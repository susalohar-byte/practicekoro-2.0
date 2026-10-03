import { expect, test } from '@playwright/test';

/**
 * Student flow regression suite.
 * Runs against the preview build with VITE_ENABLE_DEMO_MODE=true, so it must
 * not depend on authenticated data — these tests assert public routes render,
 * the canonical navigation is intact, and protected routes bounce
 * unauthenticated users to /login (server-adjacent security contract).
 */

test.describe('Student navigation', () => {
  test('bottom nav shows exactly the canonical items', async ({ page }) => {
    await page.goto('/exams');
    for (const item of ['Home', 'Test Series', 'Practice', 'Results', 'Profile']) {
      await expect(page.getByText(item, { exact: true }).first()).toBeVisible();
    }
    // Guard against regression: "Tests"/"My Tests" must never be primary nav
    await expect(page.getByText('My Tests', { exact: true })).toHaveCount(0);
  });
});

test.describe('Exams catalog', () => {
  test('renders exam cards or an empty state without crashing', async ({ page }) => {
    const response = page.waitForURL('**/exams');
    await page.goto('/exams');
    await response;
    // The page must render its header or an empty state; a JS crash renders a blank body
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Protected routes security', () => {
  test('test runner redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/exams/some-test-id/runner');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/login/);
  });

  test('results redirect unauthenticated users to /login', async ({ page }) => {
    await page.goto('/results');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Exam detail tabs', () => {
  test('exam detail exposes the three content tabs when an exam exists', async ({ page }) => {
    await page.goto('/exams');
    // Open the first exam card if any exist (skip gracefully on empty catalog)
    const firstCard = page
      .locator('a[href^="/exams/"]:not([href*="runner"]):not([href*="results"])')
      .first();
    if ((await firstCard.count()) > 0) {
      await firstCard.click();
      await page.waitForTimeout(800);
      const pageText = await page.locator('body').textContent();
      const hasTabs =
        (pageText?.includes('Full Mock') || pageText?.includes('Full Mocks')) &&
        (pageText?.includes('PYQ') || pageText?.includes('Previous Year')) &&
        (pageText?.includes('Topic Test') || pageText?.includes('Topic Tests'));
      // If the exam page loaded any content, the three-tab structure must be present
      expect(pageText?.length ?? 0).toBeGreaterThan(50);
      if (pageText && !pageText.includes('Exam not found') && !pageText.includes('not found')) {
        expect(hasTabs).toBeTruthy();
      }
    }
  });
});
