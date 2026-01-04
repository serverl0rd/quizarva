import { test, expect } from '@playwright/test';

test.describe('Player Flow', () => {
  test('should display join game form', async ({ page }) => {
    await page.goto('/player');
    
    // Check for join game elements
    await expect(page.locator('h1')).toContainText('Join Game');
    await expect(page.locator('input[placeholder*="Game ID"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Join Game")')).toBeVisible();
  });

  test('should validate join form inputs', async ({ page }) => {
    await page.goto('/player');
    
    const joinButton = page.locator('button:has-text("Join Game")');
    
    // Button should be disabled without inputs
    await expect(joinButton).toBeDisabled();
    
    // Fill in game ID
    await page.fill('input[placeholder*="Game ID"]', 'TEST123');
    
    // Still disabled without password
    await expect(joinButton).toBeDisabled();
    
    // Fill in password
    await page.fill('input[placeholder*="password"]', 'password123');
    
    // Now button should be enabled
    await expect(joinButton).toBeEnabled();
  });

  test('should show error for invalid game ID', async ({ page }) => {
    await page.goto('/player');
    
    // Fill in invalid credentials
    await page.fill('input[placeholder*="Game ID"]', 'INVALID');
    await page.fill('input[placeholder*="password"]', 'wrong');
    
    // Mock API response
    await page.route('**/api/game/join', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Game not found' })
      });
    });
    
    await page.click('button:has-text("Join Game")');
    
    // Should show error message
    await expect(page.locator('text=Game not found')).toBeVisible();
  });
});