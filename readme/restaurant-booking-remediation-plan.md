# 🛠️ Remediation Guide for Phase 0–1 Gaps

## Purpose
This guide outlines the concrete actions developers must take to close the open items discovered during the Phase 0–1 reviews. Follow each checklist before moving to subsequent phases.

## Issue Overview
| Area | Status | Blocking Risk |
| --- | --- | --- |
| Backend `.env.example` | Missing | 🚫 New contributors cannot configure the server |
| Backend setup tests | Partially implemented | ⚠️ Core infrastructure may break unnoticed |
| Frontend setup tests | Missing required scenarios | ⚠️ UI regressions slip through early |
| SQL validation suite | Partial coverage | 🚫 Schema regressions and migration errors |

---

## 1. Restore the Backend `.env.example`
**Owner:** Backend team  
**Reference:** Phase 0.1 requirements in `restaurant-booking-quick-start.md`

1. Recreate `restaurant-booking-api/.env.example` with the full variable list specified in the quick-start file. Include sane placeholder values and comments if needed for sensitive credentials.  
2. Validate every variable against the actual codebase (e.g., config loaders, scripts) so that nothing is stale.  
3. Update onboarding docs (`README.md`, setup scripts) to point new developers to `cp .env.example .env` as part of installation.  
4. Run the backend locally with the generated `.env` to ensure no additional variables are required.

✅ **Exit criteria:** `git status --short` shows the new `.env.example`, onboarding instructions reference it, and the server boots with `npm run dev` using variables from the template.

---

## 2. Expand Backend Setup Tests
**Owner:** Backend QA  
**Reference:** Phase 0.1 backend test checklist

1. In `restaurant-booking-api/tests/setup.test.ts`, add suites that cover:
   - **Server bootstrap:** start the Express app (or the bootstrapping function) and assert it listens without unhandled rejections.
   - **Database connectivity:** mock or connect to the test database to verify a successful ping and capture failures.
   - **Error middleware:** simulate a route throwing an `AppError` and assert the middleware sends the correct status/body.
   - **Logger hooks:** spy on the Winston logger (or equivalent) and ensure startup/errors are logged with the expected metadata.
   - **CORS and rate-limit headers:** send a request and verify `Access-Control-*` headers plus rate-limit values match the configuration.
2. Use Jest lifecycle hooks to start/stop resources and reset mocks so tests remain isolated.
3. Document any required environment variables for running the tests in `tests/README.md` or the main README.

✅ **Exit criteria:** The new tests fail if any checklist item regresses and pass locally/CI with `npm run test`.

---

## 3. Flesh Out Frontend Cypress Coverage
**Owner:** Frontend QA  
**Reference:** Phase 0.2 frontend test checklist

1. Open the main Cypress spec (e.g., `restaurant-booking-web/cypress/e2e/setup.cy.ts`) and add scenarios for:
   - **Responsive layouts:** iterate through mobile, tablet, and desktop viewports and ensure key elements (header, booking form, footer) render correctly.
   - **API configuration:** stub Axios/Fetch requests and assert the app reads base URLs and auth headers from environment variables.
   - **Error boundary:** force a component throw (cy.stub, React error overlay) and confirm the `ErrorBoundary` shows the fallback UI.
   - **Loading states:** intercept slow responses and verify spinners/placeholders display, then disappear when data resolves.
2. Reuse fixtures and custom commands for readability; keep specs deterministic by mocking all network calls.
3. Update Cypress documentation (`cypress/README.md`) with instructions to run these tests headlessly in CI.

✅ **Exit criteria:** `npm run cy:run` executes the new scenarios without flake and fails if any UX contract breaks.

---

## 4. Complete SQL Validation Suite
**Owner:** Database team  
**Reference:** Phase 1 validation checklist

1. Extend the SQL validation script (e.g., `restaurant-booking-api/scripts/validate-schema.sql`) to cover:
   - Presence of every table, index, and function defined in Phase 1 prompts.
   - Foreign key enforcement for all relationships, including self-referencing `customers.referred_by` and cascade behavior on deletions.
   - Unique constraint checks for emails, phone numbers, booking codes, referral codes, and compound keys (e.g., `tables` unique index).
   - Execution of triggers (e.g., `updated_at`) and functions (availability calculator, customer tier recalculation) with positive and negative cases.
2. Wrap each scenario in a transaction with rollback to keep the database clean.
3. Provide a command (Makefile/npm script) that runs the validation suite against the local Postgres instance.
4. Document seed data assumptions so tests remain stable.

✅ **Exit criteria:** Running the validation script flags schema regressions immediately and is wired into CI (e.g., `npm run db:validate`).

---

## Tracking & Sign-off
- Create tasks in your project tracker referencing this document.
- Require code review sign-off for each section before moving forward to later phases.
- After completion, update the Phase 0–1 status board to "Complete" and archive this remediation guide or move it to "done".
