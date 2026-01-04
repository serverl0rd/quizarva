# QuizArva Test Suite

This directory contains end-to-end tests for the QuizArva application using Playwright.

## Test Coverage

### 1. **Homepage Tests** (`01-homepage.spec.ts`)
- Verify homepage loads with correct title
- Test navigation to Host and Player pages
- Check main UI elements are present

### 2. **Host Flow Tests** (`02-host-flow.spec.ts`)
- Authentication requirement check
- Quiz builder form validation
- Game creation flow

### 3. **Player Flow Tests** (`03-player-flow.spec.ts`)
- Join game form display
- Form validation
- Error handling for invalid games

### 4. **Mobile Responsiveness** (`04-mobile-responsive.spec.ts`)
- Mobile layout verification
- Portrait orientation enforcement
- Buzz button size on mobile

### 5. **Real-time SSE Tests** (`05-realtime-sse.spec.ts`)
- SSE connection establishment
- Connection status indicators
- Real-time update mechanism

### 6. **PWA Feature Tests** (`06-pwa-features.spec.ts`)
- Manifest.json availability
- Service worker registration
- PWA meta tags

### 7. **Accessibility Tests** (`07-accessibility.spec.ts`)
- Heading hierarchy
- Keyboard navigation
- Color contrast
- Button labeling

## Running Tests

### Quick Start
```bash
./run-tests.sh
```

### Manual Testing
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run all tests
npm run test

# Run specific test file
npx playwright test 01-homepage.spec.ts

# Run tests with UI
npx playwright test --ui

# Run tests in debug mode
npx playwright test --debug
```

### Test Reports
- HTML Report: `npx playwright show-report`
- Test results are saved in `test-results/`

## Test Configuration

Tests are configured in `/playwright.config.ts`:
- Base URL: http://localhost:3000
- Parallel execution enabled
- Screenshots on failure
- Trace on first retry
- Both desktop and mobile viewports

## Writing New Tests

1. Create a new `.spec.ts` file in this directory
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Group related tests:
   ```typescript
   test.describe('Feature Name', () => {
     test('should do something', async ({ page }) => {
       // Test implementation
     });
   });
   ```

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:
```yaml
- name: Install dependencies
  run: npm ci
- name: Install Playwright
  run: npx playwright install --with-deps
- name: Run tests
  run: npm test
```

## Known Limitations

1. **Authentication**: Tests currently don't fully mock NextAuth
2. **Database**: Tests run against development database
3. **Real-time**: SSE tests are limited without full game simulation
4. **Mobile**: Some mobile-specific features need real device testing

## Future Improvements

1. Add API mocking for isolated testing
2. Create test data fixtures
3. Add visual regression tests
4. Implement full game flow tests
5. Add performance benchmarks