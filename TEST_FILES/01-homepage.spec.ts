import { test, expect } from '@playwright/test';

test.describe('QuizArva Homepage', () => {
  test('should display the homepage with correct title and options', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/QuizArva/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('QuizArva');
    
    // Check both host and player options are visible
    await expect(page.locator('text=Host a Game')).toBeVisible();
    await expect(page.locator('text=Join as Player')).toBeVisible();
  });

  test('should navigate to host page when clicking Host a Game', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Host a Game');
    await expect(page).toHaveURL('/host');
  });

  test('should navigate to player page when clicking Join as Player', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Join as Player');
    await expect(page).toHaveURL('/player');
  });
});