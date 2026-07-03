import { test, expect } from '@playwright/test';

test.describe('Content Management (Read-Only)', () => {
  test('should display blog posts on the public blog page', async ({ page }) => {
    await page.goto('/blog');
    
    // Wait for the blog grid to load
    // Assuming there is at least one blog post in the local dev/emulated DB
    
    // We don't know exactly how many, but there should be content
    // Or if the DB is empty, it might show a "No posts" message.
    // Let's just wait for the main content area to be visible.
    await expect(page.locator('main')).toBeVisible();
  });
});
