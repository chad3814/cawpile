# Specification: Fix Failing Tests

## Goal
Fix 10 failing tests across 3 test files by updating outdated test expectations, correcting mock setup timing, and improving database test isolation.

## User Stories
- As a developer, I want all tests to pass so that CI/CD pipelines are unblocked
- As a maintainer, I want tests to accurately reflect current implementation behavior

## Specific Requirements

**Fix ReviewImageTemplate.test.tsx branding text expectation**
- File: `__tests__/components/ReviewImageTemplate.test.tsx`
- Line 68 expects `'Cawpile'` but component renders `'CAWPILE.org'` (see `src/components/share/ReviewImageTemplate.tsx` line 551)
- Update the expectation from `expect(screen.getByText('Cawpile'))` to `expect(screen.getByText('CAWPILE.org'))`
- This single change fixes all 3 failing tests in this file since they all render the same branding element

**Fix resync.test.ts mock implementation timing**
- File: `__tests__/api/admin/resync.test.ts`
- The mock at lines 16-21 creates a default mock, but individual tests call `MockSearchOrchestrator.mockImplementation()` after the route import
- Issue: The route handler instantiates `new SearchOrchestrator()` at runtime (line 93 of route.ts), but the mock replacement happens too late
- Move the `mockImplementation` calls into `beforeEach` blocks OR restructure mocks to use `mockReturnValue` on the `search` method consistently
- Ensure `jest.clearAllMocks()` in `afterEach` does not inadvertently reset the mock implementation before tests run
- The 3 failing tests (lines 251, 283, 322) all expect HTTP 200 but receive 404 because the mock is not intercepting the constructor properly

**Fix share-e2e.test.ts database constraint violations**
- File: `__tests__/integration/share-e2e.test.ts`
- Error occurs at line 52: `Unique constraint failed on the fields: (isbn13)`
- The `beforeAll` hook creates test data with `isbn13: 978${nanoid(10)}` which can collide with leftover data from previous failed runs
- Add cleanup at the START of `beforeAll` to delete any stale test data before creating new records
- Pattern to follow: `await prisma.edition.deleteMany({ where: { isbn13: { startsWith: '978' } } })` with appropriate scope limiting
- Alternative: Use a more unique prefix per test run like `isbn13: 978-test-${Date.now()}-${nanoid(6)}`

**Ensure test isolation in nested describe blocks**
- The `Invalid ShareToken Handling` describe block (lines 556-580) should not require any test data setup since it tests non-existent tokens
- Verify that `beforeAll` at line 31 only runs once per file, not per describe block
- The 4 failures in this test are caused by the `beforeAll` constraint violation, not the tests themselves

**Maintain existing cleanup patterns**
- The `afterEach` cleanup at lines 129-135 already deletes shared reviews by userId - keep this pattern
- The `afterAll` cleanup at lines 103-127 properly cascades deletes in FK order - maintain this structure
- Add similar defensive cleanup at start of `beforeAll` to handle interrupted test runs

**Verify mock reset behavior**
- In resync.test.ts, `jest.clearAllMocks()` at line 119 clears mock call history but should not affect `mockImplementation`
- Consider using `jest.resetAllMocks()` if implementation needs to be reset, or explicitly set implementation in each test

**Follow existing test patterns in codebase**
- Reference `__tests__/database/sharedReview.test.ts` for proper `beforeAll`/`afterAll`/`afterEach` structure
- Reference `__tests__/api/admin/resync.test.ts` lines 82-106 for proper cleanup order (AdminAuditLog, provider records, editions, books, users)
- Use `nanoid(6)` for unique identifiers in test emails and book titles

**Test the fixes locally before committing**
- Run `npm run test -- __tests__/components/ReviewImageTemplate.test.tsx` to verify branding fix
- Run `npm run test -- __tests__/api/admin/resync.test.ts` to verify mock fix
- Run `npm run test -- __tests__/integration/share-e2e.test.ts` to verify isolation fix

## Existing Code to Leverage

**`__tests__/database/sharedReview.test.ts` cleanup pattern**
- Uses `afterEach` to clean up test-specific records (line 87-92)
- Proper FK cascade order in `afterAll` (lines 64-85)
- Shows how to isolate tests that create unique database records

**`__tests__/api/admin/resync.test.ts` existing mock structure**
- Lines 16-21 show mock setup pattern for SearchOrchestrator
- Lines 44-45 show typed mock reference creation
- The mock object structure with `registerProvider` and `search` methods is already correct

**`src/components/share/ReviewImageTemplate.tsx` branding**
- Line 551 shows actual rendered text: `CAWPILE.org`
- This is the source of truth for what the test should expect

**Jest mock timing documentation**
- `jest.mock()` hoists to top of file, runs before imports
- `mockImplementation()` called in test body runs after module load
- For constructor mocks, implementation must be set before the code-under-test runs

## Out of Scope
- Do NOT modify the actual component code in ReviewImageTemplate.tsx
- Do NOT modify the API route implementation in resync/route.ts
- Do NOT change database schema or Prisma models
- Do NOT add new test cases beyond fixing existing failures
- Do NOT refactor test structure beyond what is needed for the fix
- Do NOT modify any application code outside of test files
- Do NOT change mock behavior to mask real bugs in application code
- Do NOT disable or skip any tests
- Do NOT add new dependencies to the test infrastructure
- Do NOT modify jest.config.js or test setup files
