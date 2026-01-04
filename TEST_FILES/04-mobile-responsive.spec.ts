import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 12']);

test.describe('Mobile Responsiveness', () => {
  test('should display mobile-optimized homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the layout is mobile-friendly
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    
    // Buttons should be stacked vertically on mobile
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount >= 2) {
      const firstButton = buttons.nth(0);
      const secondButton = buttons.nth(1);
      
      const firstBox = await firstButton.boundingBox();
      const secondBox = await secondButton.boundingBox();
      
      if (firstBox && secondBox) {
        // Second button should be below first button (y coordinate greater)
        expect(secondBox.y).toBeGreaterThan(firstBox.y);
      }
    }
  });

  test('should show portrait orientation warning in landscape', async ({ page, context }) => {
    // Set viewport to landscape
    await page.setViewportSize({ width: 812, height: 375 });
    
    await page.goto('/player/game/test123');
    
    // Should show rotation message
    await expect(page.locator('text=rotate your device')).toBeVisible();
  });

  test('buzz button should be large on mobile', async ({ page }) => {
    await page.goto('/player/game/test123');
    
    const buzzButton = page.locator('button:has-text("BUZZ")');
    
    if (await buzzButton.isVisible()) {
      const box = await buzzButton.boundingBox();
      
      if (box) {
        // Buzz button should take significant portion of screen
        expect(box.height).toBeGreaterThan(200); // At least 200px tall
      }
    }
  });
});