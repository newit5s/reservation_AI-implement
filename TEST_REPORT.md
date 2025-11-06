# Test Report

## Backend (restaurant-booking-api)
- Command: `npm test`
- Result: ✅ All 5 Jest test suites passed (16 tests total).
- Notable logs: Winston reported simulated errors during tests for monitoring (e.g., "Unhandled failure" and "Database connection failed"), but the suites still passed.

## Frontend (restaurant-booking-web)
- Command: `npm run test:e2e`
- Result: ❌ Cypress could not start because the system is missing the `Xvfb` dependency required for headless browser execution in this environment.
- Error: `Error: spawn Xvfb ENOENT`
- Suggested fix: Install Xvfb or use a Cypress Docker image with the required dependencies.
- Log file: `logs/test_errors.log` captures the most recent failure details for easier tracking.
