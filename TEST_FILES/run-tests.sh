#!/bin/bash

# QuizArva Test Suite Runner

echo "🧪 QuizArva Test Suite"
echo "====================="
echo ""

# Check if dependencies are installed
if ! npm list @playwright/test > /dev/null 2>&1; then
    echo "📦 Installing Playwright..."
    npm install --save-dev @playwright/test
    npx playwright install
fi

# Start the dev server in the background
echo "🚀 Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 10

# Run the tests
echo ""
echo "🏃 Running tests..."
echo ""

# Run tests with nice output
npx playwright test --reporter=list

# Capture test exit code
TEST_EXIT_CODE=$?

# Kill the dev server
echo ""
echo "🛑 Stopping development server..."
kill $DEV_PID

# Generate report if tests failed
if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "📊 Generating HTML report..."
    npx playwright show-report
fi

echo ""
echo "✅ Test run complete!"

exit $TEST_EXIT_CODE