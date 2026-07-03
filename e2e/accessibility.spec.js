import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('Home page should not have automatically detectable accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the main content to load and finish skeleton loading
    await page.waitForSelector('main');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['page-has-heading-one', 'color-contrast'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Projects page should not have automatically detectable accessibility violations', async ({ page }) => {
    await page.goto('/projects');
    
    await page.waitForSelector('main');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .disableRules(['page-has-heading-one', 'color-contrast'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
