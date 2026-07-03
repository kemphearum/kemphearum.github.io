import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to the Projects page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('nav a[href="/projects"]');
    
    // Find the visible Projects link in the navigation menu
    const projectsLink = page.locator('nav a[href="/projects"]').filter({ state: 'visible' }).first();
    await projectsLink.click();
    
    // Verify the URL and heading
    await expect(page).toHaveURL(/.*\/projects/);
    await expect(page.getByRole('heading', { name: /projects/i, level: 2 })).toBeVisible();
  });

  test('should navigate to the Blog page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('nav a[href="/blog"]');
    
    const blogLink = page.locator('nav a[href="/blog"]').filter({ state: 'visible' }).first();
    await blogLink.click();
    
    await expect(page).toHaveURL(/.*\/blog/);
    await expect(page.getByRole('heading', { name: /blog/i, level: 2 })).toBeVisible();
  });
});
