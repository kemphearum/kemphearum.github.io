import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('should redirect unauthenticated users to login page', async ({ page }) => {
    // Attempt to access admin dashboard
    await page.goto('/admin');

    // Should stay on /admin or /admin/login (but in this app it's /admin)
    await expect(page).toHaveURL(/.*\/admin/);
    
    // Should see a login form
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
  });
});
