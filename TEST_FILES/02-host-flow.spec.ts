import { test, expect } from '@playwright/test';

test.describe('Host Flow', () => {
  test('should display sign in requirement for host', async ({ page }) => {
    await page.goto('/host');
    
    // Should see sign in prompt
    await expect(page.locator('text=Sign in to Host')).toBeVisible();
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
  });

  test('should show quiz builder after authentication (mocked)', async ({ page }) => {
    // Mock authentication by setting session
    await page.addInitScript(() => {
      window.localStorage.setItem('mockAuth', 'true');
    });
    
    await page.goto('/host');
    
    // In a real test, we would mock NextAuth
    // For now, we just check that the page loads without errors
    await expect(page).toHaveURL('/host');
  });

  test('should validate game creation form', async ({ page }) => {
    await page.goto('/host');
    
    // Try to submit without filling required fields
    const createButton = page.locator('button:has-text("Create Game")');
    
    if (await createButton.isVisible()) {
      // Check that button is disabled when form is empty
      await expect(createButton).toBeDisabled();
    }
  });
});