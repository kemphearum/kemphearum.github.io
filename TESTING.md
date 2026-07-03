# Testing Guide

This document outlines the testing strategy and infrastructure for the portfolio project.

## Overview

We use two primary testing frameworks:
- **Vitest** for Unit and Component testing.
- **Playwright** for End-to-End (E2E) and Integration testing.

## Running Tests

### Unit & Component Tests

```bash
# Run tests once
npm run test

# Run tests in watch mode (ideal for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### End-to-End Tests

```bash
# Run all E2E tests headlessly
npm run test:e2e

# Run E2E tests with the Playwright UI (ideal for debugging)
npm run test:e2e:ui
```

> [!NOTE]
> E2E tests automatically start the local Vite development server before running.

## Code Coverage

We use `@vitest/coverage-v8` to track code coverage. The CI pipeline will enforce the following thresholds:
- Statements: 90%
- Branches: 85%
- Functions: 90%
- Lines: 90%

If a PR drops coverage below these thresholds, the CI build will fail.

## Writing Tests

### Unit Tests
Place unit tests next to the file they test, ending in `.test.js` or `.test.jsx`. Use `@testing-library/react` for components.

### E2E Tests
Place E2E tests in the `/e2e` directory, ending in `.spec.js`. 

## Accessibility Testing

- **Component Level**: We use `jest-axe` within Vitest. You can assert accessibility using `expect(container).toHaveNoViolations()`.
- **E2E Level**: We use `@axe-core/playwright` within Playwright. See `e2e/accessibility.spec.js` for examples.
