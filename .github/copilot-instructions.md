# Copilot Instructions for Playwright Testing Project

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Playwright testing project for end-to-end web automation and testing.

## Project Guidelines

- Use TypeScript for all test files
- Follow Playwright best practices for test organization
- Use Page Object Model pattern for complex page interactions
- Implement proper test data management and cleanup
- Use descriptive test names and organize tests logically
- Leverage Playwright's built-in assertions and expect methods
- Use proper selectors (prefer data-testid, avoid brittle selectors)
- Implement proper waiting strategies (avoid hard waits)
- Use fixtures for test setup and teardown
- Follow the existing project structure in the `tests/` directory

## Test Structure

- Place test files in the `tests/` directory with `.spec.ts` extension
- Use page objects in `tests/pages/` directory for reusable page interactions
- Store test data in `tests/data/` directory
- Use `tests/fixtures/` for custom fixtures and test utilities

## Playwright Specific

- Always use `await` with Playwright methods
- Prefer `page.locator()` over `page.$()` for better auto-waiting
- Use `expect()` from `@playwright/test` for assertions
- Leverage test.describe() for grouping related tests
- Use test.beforeEach() and test.afterEach() for setup/cleanup
