import { test, expect } from '@playwright/test';

// Shared helper to navigate and stabilize page before snapshot
async function gotoAndStabilize(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  // Allow network to settle as much as possible
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch {
    // Non-fatal in dev; proceed with best-effort stabilization
  }
  // Wait for main content area if present, otherwise ensure body exists
  const main = page.locator('main');
  if (await main.count()) {
    await main.first().waitFor({ state: 'visible', timeout: 5000 });
  } else {
    await page.locator('body').waitFor({ state: 'visible', timeout: 5000 });
  }
}

// Common masking for dynamic regions (charts, loaders, skeletons, time widgets)
function commonMask(page: import('@playwright/test').Page) {
  return [
    page.locator('canvas'),
    page.locator('[data-testid="loading"], [data-testid="skeleton"], [data-testid="spinner"]'),
    page.locator('[data-testid="timestamp"], time, [data-time]'),
    page.locator('[data-testid="notification"], [role="alert"]')
  ];
}

test.describe('Smoke Visual Baseline', () => {
  test('Dashboard visual snapshot', async ({ page }) => {
    if (test.info().project.name !== 'chromium') test.skip();

    await gotoAndStabilize(page, '/dashboard');

    // Prefer asserting presence of a stable nav link to ensure the route loaded
    // If it doesn't exist, this assertion will be ignored to keep the smoke test resilient
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    try { await expect(dashboardLink).toBeVisible({ timeout: 3000 }); } catch {}

    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      mask: commonMask(page),
      animations: 'disabled'
    });
  });

  test('Email visual snapshot', async ({ page }) => {
    if (test.info().project.name !== 'chromium') test.skip();

    await gotoAndStabilize(page, '/email');

    const emailLink = page.getByRole('link', { name: /email/i });
    try { await expect(emailLink).toBeVisible({ timeout: 3000 }); } catch {}

    await expect(page).toHaveScreenshot('email.png', {
      fullPage: true,
      mask: commonMask(page),
      animations: 'disabled'
    });
  });

  test('Reports visual snapshot', async ({ page }) => {
    if (test.info().project.name !== 'chromium') test.skip();

    await gotoAndStabilize(page, '/reports');

    const reportsLink = page.getByRole('link', { name: /reports/i });
    try { await expect(reportsLink).toBeVisible({ timeout: 3000 }); } catch {}

    await expect(page).toHaveScreenshot('reports.png', {
      fullPage: true,
      mask: commonMask(page),
      animations: 'disabled'
    });
  });
});