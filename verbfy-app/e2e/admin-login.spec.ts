import { test, expect } from '@playwright/test';

test.describe('Admin Login (Playwright)', () => {
  test('loads /admin/login and shows Secure Login button', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin\/login/);
    const button = page.getByRole('button', { name: /Secure Login/i });
    await expect(button).toBeVisible();
    const form = page.locator('[data-testid="admin-login-form"]');
    await expect(form).toBeVisible();
  });
});