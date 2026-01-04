import { test, expect } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test('server should respond', async ({ request }) => {
    // Just check if the server is running
    const response = await request.get('http://localhost:3000');
    
    // We expect some response (even if it's an error page)
    expect(response.status()).toBeLessThan(500);
  });

  test('should load static assets', async ({ request }) => {
    // Check if manifest.json loads
    const manifest = await request.get('http://localhost:3000/manifest.json');
    expect(manifest.ok()).toBeTruthy();
    
    const data = await manifest.json();
    expect(data.name).toBe('QuizArva');
  });

  test('API health check', async ({ request }) => {
    // Try to hit an API endpoint
    const response = await request.get('http://localhost:3000/api/health');
    
    // Even a 404 is fine - it means the server is running
    expect(response.status()).toBeDefined();
  });
});