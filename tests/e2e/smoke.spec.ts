import { expect, test } from '@playwright/test';

test.describe('Landing page', () => {
  test('loads and exposes primary navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PracticeKoro/i);
    await expect(page.locator('body')).toContainText(/PracticeKoro/i);
  });

  test('renders hero headline and dual CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const loginButton = page.getByRole('button', { name: 'Login', exact: true });
    if (!(await loginButton.isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Open menu' }).click();
    }
    await expect(loginButton).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Get Started', exact: true }).first()
    ).toBeVisible();
  });

  test('exam catalog section filters by search query', async ({ page }) => {
    await page.goto('/');
    const search = page.getByPlaceholder('Search exams...');
    await expect(search).toBeVisible();

    await search.fill('WBP');
    // WBP Constable must survive the filter; Railway/SSC GD must not be visible
    await expect(page.getByText('WBP Constable', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Railway (RRB)')).toHaveCount(0);

    await search.fill('zzz-no-match');
    await expect(page.getByText('No exams found', { exact: true })).toBeVisible();
  });
});

test.describe('FAQ accordion', () => {
  test('expands exactly one answer at a time and toggles closed on re-click', async ({ page }) => {
    await page.goto('/');
    const faqButtons = page.locator('section:has-text("Frequently Asked Questions") button');
    const first = faqButtons.nth(0);
    const second = faqButtons.nth(1);

    await expect(first).toContainText('Mistakes Notebook');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');

    await expect(second).toHaveAttribute('aria-expanded', 'false');
    await second.click();
    await expect(second).toHaveAttribute('aria-expanded', 'true');
    // First answer must have collapsed when the second opened
    await expect(first).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Routing guards', () => {
  test('unknown routes render the app shell fallback without crashing', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveTitle(/PracticeKoro/i);
  });

  test('protected route redirects anonymous users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('admin route redirects anonymous users to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});

test('student can discover a topic test and must authenticate before opening the runner', async ({
  page,
}) => {
  // The one-click demo buttons were removed from the login page (559124d).
  // Seed the demo session the same way AuthContext's demo login did, then navigate.
  await page.addInitScript(() => {
    // Matches MOCK_STUDENT_USER (services/mockData.ts) so AuthContext restore works in demo mode
    const demoUser = {
      id: 'usr-student-001',
      fullName: 'Subhamoy Banerjee',
      email: 'student@practicekoro.com',
      phone: '+91 98765 43210',
      avatarUrl: '',
      targetExamId: 'wbp-constable',
      role: 'student',
      createdAt: '2025-01-10T10:00:00Z',
    };
    localStorage.setItem('practicekoro_user', JSON.stringify(demoUser));
    localStorage.setItem('practicekoro_selected_exam', 'wbp-constable');
    // Premium tests only render the "Start Test Now" CTA for entitled users
    // (see useSubscription/hasAccessToTest), so seed an active Pro pass too.
    localStorage.setItem('practicekoro_is_pro', 'true');
  });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto('/practice');
  await page
    .getByRole('button', { name: /See All/i })
    .first()
    .click();
  await page
    .getByRole('button', { name: /Indian History/i })
    .first()
    .click();
  await page
    .getByRole('button', { name: /Indus Valley Civilization/i })
    .first()
    .click();
  await page
    .getByRole('button', { name: /Start Test/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/exams\/test-indus-01$/);
  await page
    .getByRole('button', { name: /Start Test Now/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login$/);
});
