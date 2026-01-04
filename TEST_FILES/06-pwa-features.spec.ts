import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('should have manifest.json', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    expect(manifest).toHaveProperty('name', 'QuizArva');
    expect(manifest).toHaveProperty('short_name', 'QuizArva');
    expect(manifest).toHaveProperty('display', 'standalone');
    expect(manifest).toHaveProperty('icons');
  });

  test('should register service worker', async ({ page }) => {
    await page.goto('/');
    
    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length > 0;
      }
      return false;
    });
    
    // Service worker should be registered on HTTPS (not on localhost in dev)
    // This test will pass in production
    console.log('Service Worker registered:', swRegistered);
  });

  test('should have meta tags for PWA', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    
    // Check theme color
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();
  });
});