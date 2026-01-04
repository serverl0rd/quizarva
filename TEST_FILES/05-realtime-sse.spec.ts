import { test, expect } from '@playwright/test';

test.describe('Real-time SSE Connection', () => {
  test('should establish SSE connection for game updates', async ({ page }) => {
    // Monitor SSE connections
    const sseConnections: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/sse/game/')) {
        sseConnections.push(request.url());
      }
    });
    
    // Navigate to a game page (would need mock auth)
    await page.goto('/player/game/test123');
    
    // Wait a bit for SSE to connect
    await page.waitForTimeout(1000);
    
    // Should have attempted SSE connection
    const sseRequests = sseConnections.filter(url => url.includes('sse'));
    expect(sseRequests.length).toBeGreaterThan(0);
  });

  test('should show connection status indicator', async ({ page }) => {
    await page.goto('/player/game/test123');
    
    // Look for connection status indicator
    const connectedIndicator = page.locator('text=Connected').or(page.locator('text=🟢'));
    const disconnectedIndicator = page.locator('text=Disconnected').or(page.locator('text=🔴'));
    
    // Should show either connected or disconnected
    await expect(connectedIndicator.or(disconnectedIndicator)).toBeVisible();
  });
});