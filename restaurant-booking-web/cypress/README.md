# Cypress End-to-End Tests

This suite validates the frontend setup, API integration, responsive layout, and error handling flows.

## Running the Tests

Run the Cypress tests headlessly in CI (or locally) with:

```bash
npm run test:e2e
```

The command uses the configuration in `cypress.config.ts`. Ensure the frontend dev server is running (`npm run dev`) in another terminal before executing the tests.
