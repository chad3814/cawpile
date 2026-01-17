# Specification: Fix Failing Integration Test - Share E2E

## Goal
Fix the "Edge Case: Book Without Rating" test in `__tests__/integration/share-e2e.test.ts` which fails with a foreign key constraint violation due to improper test data isolation.

## User Stories
- As a developer, I want all integration tests to pass reliably so that CI/CD pipelines are not blocked by flaky tests
- As a developer, I want tests to be properly isolated so that test execution order does not affect results

## Specific Requirements

**Create independent test data chain for "Edge Case: Book Without Rating" test**
- Test must create its own Book record instead of reusing `testBookId`
- Test must create its own Edition record linked to the new Book
- Test must create its own UserBook record linked to the new Edition
- The data chain must be: Book -> Edition -> UserBook (respecting foreign key constraints)
- All three records should use unique identifiers (nanoid) to prevent conflicts

**Implement proper cleanup within the test**
- Cleanup must occur in reverse foreign key order: UserBook -> Edition -> Book
- Cleanup should happen in a finally block or at end of test to ensure execution
- Cleanup should only delete the test-specific records, not shared test data

**Maintain existing test logic and assertions**
- The test's core functionality (verifying 400 response for book without rating) must not change
- The mock user setup and API request structure should remain the same
- Expected response status (400) and error message must be preserved

**Follow existing test patterns from beforeAll**
- Use the same Prisma client instance (`prisma`) for all database operations
- Use `nanoid` for generating unique identifiers (already imported in file)
- Mirror the data creation pattern used in lines 44-86 of the test file

**Ensure test isolation from other tests**
- The test should not depend on any data created in `beforeAll`
- The test should not be affected by `afterAll` cleanup of shared test data
- The test should be runnable in any order relative to other tests in the suite

## Visual Design
No visual assets provided - this is a test infrastructure fix.

## Existing Code to Leverage

**beforeAll block pattern (lines 32-103)**
- Shows correct pattern for creating Book -> Edition -> UserBook chain
- Demonstrates proper use of nanoid for unique identifiers
- Uses correct Prisma create syntax with nested data structure

**afterAll cleanup pattern (lines 105-129)**
- Shows correct reverse-order deletion respecting foreign keys
- Demonstrates use of deleteMany with where clauses
- Pattern: SharedReview -> CawpileRating -> UserBook -> GoogleBook -> Edition -> Book -> User

**Existing edge case test structure (lines 313-363)**
- Current test creates Edition at line 316-321 (referencing `testBookId`)
- Current test creates UserBook at line 323-330 (referencing new edition)
- Cleanup at lines 360-361 deletes UserBook then Edition
- Missing: Book creation step, which causes the foreign key failure

**Test mock setup pattern (lines 332-338)**
- Shows how to mock getCurrentUser for API route testing
- Same mock pattern should be preserved in the fix

## Out of Scope
- Changes to application code (API routes, models, services)
- Changes to other test files or test suites
- Changes to the database schema (prisma/schema.prisma)
- Adding new test cases beyond fixing the existing failing test
- Refactoring other tests in this file for better isolation
- Changes to the beforeAll/afterAll blocks of the parent describe
- Performance optimization of test execution
- Adding beforeEach/afterEach hooks at the describe block level
- Modifying the test assertion logic or expected values
- Adding test utilities or helper functions
