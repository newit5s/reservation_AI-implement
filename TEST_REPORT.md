# Test Report

## Backend (restaurant-booking-api)
- Command: `npm test --prefix restaurant-booking-api`
- Result: ✅ All 7 Jest test suites passed (22 tests total).
- Notable logs: Winston emits simulated operational logs during tests (e.g., "Unhandled failure" and "Database connection failed") along with a warning when the notification delegate is intentionally unavailable; these are expected for monitoring coverage.

## Frontend (restaurant-booking-web)
- Command: `npm run test:e2e`
- Result: ❌ Cypress could not start because the system is missing the `Xvfb` dependency required for headless browser execution in this environment.
- Error: `Error: spawn Xvfb ENOENT`
- Suggested fix: Install Xvfb or use a Cypress Docker image with the required dependencies.
- Log file: `logs/test_errors.log` captures the most recent failure details for easier tracking.
