import { test, expect } from '@playwright/test';

test.describe('Unit Tests - No Server Required', () => {
  test('Playwright is installed correctly', async () => {
    // Simple test to verify Playwright works
    expect(true).toBe(true);
  });

  test('Can create a browser context', async ({ browser }) => {
    const context = await browser.newContext();
    expect(context).toBeDefined();
    await context.close();
  });

  test('Can navigate to a page', async ({ page }) => {
    // Navigate to Playwright's own site as a test
    await page.goto('https://playwright.dev');
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('Basic math operations work', async ({ page }) => {
    const result = await page.evaluate(() => {
      return 2 + 2;
    });
    expect(result).toBe(4);
  });

  test('Can work with local storage', async ({ page }) => {
    await page.goto('about:blank');
    
    await page.evaluate(() => {
      localStorage.setItem('test', 'value');
    });
    
    const value = await page.evaluate(() => {
      return localStorage.getItem('test');
    });
    
    expect(value).toBe('value');
  });

  test('Can take screenshots', async ({ page }) => {
    await page.goto('about:blank');
    await page.setContent('<h1>Test Page</h1>');
    
    const screenshot = await page.screenshot();
    expect(screenshot).toBeDefined();
    expect(screenshot.length).toBeGreaterThan(0);
  });
});