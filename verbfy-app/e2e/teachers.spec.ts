import { test, expect } from '@playwright/test';

test.describe('Teachers Page (Playwright)', () => {
  test('loads /admin/teachers (or redirects to /login) and renders content', async ({ page }) => {
    await page.goto('/admin/teachers');
    const currentUrl = page.url();
    if (/\/login/.test(currentUrl)) {
      // Unauthenticated redirect; verify generic login page renders
      await expect(page).toHaveURL(/\/login/);
      const form = page.locator('form').first();
      await expect(form).toBeVisible();
    } else {
      // Teachers page accessible; verify main content
      await expect(page).toHaveURL(/\/admin\/teachers/);
      await page.waitForLoadState('domcontentloaded');
      const bodyText = await page.locator('body').textContent();
      expect((bodyText ?? '').length).toBeGreaterThan(0);
    }
  });
});