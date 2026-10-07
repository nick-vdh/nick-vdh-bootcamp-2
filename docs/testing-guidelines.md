# Testing Guidelines

All new features should include appropriate tests. Tests must be maintainable, follow best practices, and be isolated and independent. Each test should set up its own data and must not rely on another test. Required setup and teardown hooks should ensure tests succeed across multiple runs.

## Unit Tests

- Use Jest to test individual functions and React components in isolation.
- Use the naming convention `*.test.js` or `*.test.ts`.
- Place backend unit tests in `packages/backend/__tests__/`.
- Place frontend unit tests in `packages/frontend/src/__tests__/`.
- Name files after the code being tested, such as `app.test.js` for `app.js`.

## Integration Tests

- Use Jest and Supertest to test backend API endpoints with real HTTP requests.
- Place integration tests in `packages/backend/__tests__/integration/`.
- Use the naming convention `*.test.js` or `*.test.ts`.
- Name files for the behavior being tested, such as `todos-api.test.js` for TODO API endpoints.

## End-to-End Tests

- Use Playwright, the required framework, to test complete UI workflows through browser automation.
- Place E2E tests in `tests/e2e/`.
- Use the naming convention `*.spec.js` or `*.spec.ts`.
- Name files after the user journey being tested, such as `todo-workflow.spec.js`.
- Use one browser only.
- Use the Page Object Model (POM) pattern for maintainability.
- Limit E2E coverage to 5-8 critical user journeys. Focus on happy paths and key edge cases rather than exhaustive coverage.

## Port Configuration

Always configure ports through environment variables with sensible defaults:

- Backend: `const PORT = process.env.PORT || 3030;`
- Frontend: React defaults to port `3000`, which can be overridden with the `PORT` environment variable.

This allows CI/CD workflows to dynamically detect ports.
