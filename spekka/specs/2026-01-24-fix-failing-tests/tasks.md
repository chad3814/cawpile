# Task Breakdown: Fix Failing Tests

## Overview
Total Tasks: 10 failing tests across 3 test files
Total Task Groups: 3 (independent, can be executed in parallel)

## Task List

### Test File Fixes

#### Task Group 1: ReviewImageTemplate Branding Fix
**Dependencies:** None
**Complexity:** Low (single line change)

- [x] 1.0 Fix ReviewImageTemplate.test.tsx branding expectation
  - [x] 1.1 Read the test file to understand current state
    - File: `__tests__/components/ReviewImageTemplate.test.tsx`
    - Identify line 68 with incorrect expectation
  - [x] 1.2 Verify the actual component renders 'CAWPILE.org'
    - Check `src/components/share/ReviewImageTemplate.tsx` line 551
    - Confirm branding text is `CAWPILE.org`
  - [x] 1.3 Update test expectation from 'Cawpile' to 'CAWPILE.org'
    - Change `expect(screen.getByText('Cawpile'))` to `expect(screen.getByText('CAWPILE.org'))`
    - This single change fixes all 3 failing tests
  - [x] 1.4 Run test to verify fix
    - Execute: `npm run test -- __tests__/components/ReviewImageTemplate.test.tsx`
    - All 3 tests should now pass

**Acceptance Criteria:**
- Test expectation matches actual component output
- All 3 tests in ReviewImageTemplate.test.tsx pass
- No modifications to component code (only test file)

---

#### Task Group 2: Resync API Mock Timing Fix
**Dependencies:** None
**Complexity:** Medium (mock structure refactoring)

- [x] 2.0 Fix resync.test.ts mock implementation timing
  - [x] 2.1 Read the test file to understand mock structure
    - File: `__tests__/api/admin/resync.test.ts`
    - Identify mock setup at lines 16-21
    - Identify failing tests at lines 251, 283, 322
  - [x] 2.2 Analyze why mocks are not intercepting properly
    - Check if `mockImplementation()` is called after route import
    - Verify mock timing relative to route handler instantiation
    - Review `jest.clearAllMocks()` impact at line 119
  - [x] 2.3 Restructure mock setup for proper timing
    - Option A: Move `mockImplementation` calls into `beforeEach` blocks
    - Option B: Use `mockReturnValue` on `search` method consistently
    - Ensure constructor mock is applied before route handler executes
  - [x] 2.4 Verify mock reset behavior
    - Confirm `jest.clearAllMocks()` does not reset implementation
    - Consider `jest.resetAllMocks()` if implementation needs reset
    - Explicitly set implementation in each test if needed
  - [x] 2.5 Run test to verify fix
    - Execute: `npm run test -- __tests__/api/admin/resync.test.ts`
    - All 3 previously failing tests should now return HTTP 200

**Acceptance Criteria:**
- Mock intercepts SearchOrchestrator constructor properly
- Tests receive expected HTTP 200 responses instead of 404
- All tests in resync.test.ts pass
- No modifications to API route code (only test file)

---

#### Task Group 3: Share E2E Database Isolation Fix
**Dependencies:** None
**Complexity:** Medium (database cleanup strategy)

- [x] 3.0 Fix share-e2e.test.ts database constraint violations
  - [x] 3.1 Read the test file to understand data setup
    - File: `__tests__/integration/share-e2e.test.ts`
    - Identify `beforeAll` hook around line 31
    - Locate isbn13 creation at line 52
  - [x] 3.2 Review existing cleanup patterns in codebase
    - Check `__tests__/database/sharedReview.test.ts` for reference patterns
    - Note FK cascade order in `afterAll` (lines 64-85)
    - Understand `afterEach` cleanup at lines 129-135
  - [x] 3.3 Add defensive cleanup at START of beforeAll
    - Delete stale test data before creating new records
    - Use pattern: `await prisma.edition.deleteMany({ where: { isbn13: { startsWith: '978' } } })` with appropriate scope
    - Alternative: Use more unique prefix like `978-test-${Date.now()}-${nanoid(6)}`
  - [x] 3.4 Verify beforeAll scope
    - Confirm `beforeAll` at line 31 runs once per file, not per describe block
    - Ensure `Invalid ShareToken Handling` describe block (lines 556-580) is not affected
  - [x] 3.5 Maintain existing cleanup patterns
    - Keep `afterEach` cleanup at lines 129-135
    - Keep `afterAll` cascade delete structure at lines 103-127
  - [x] 3.6 Run test to verify fix
    - Execute: `npm run test -- __tests__/integration/share-e2e.test.ts`
    - All 4 previously failing tests should now pass

**Acceptance Criteria:**
- No unique constraint violations on isbn13
- Test data properly isolated from previous runs
- Cleanup handles interrupted test runs gracefully
- All 4 tests in share-e2e.test.ts pass
- No modifications to application code (only test file)

---

### Verification

#### Task Group 4: Full Test Suite Verification
**Dependencies:** Task Groups 1, 2, 3

- [x] 4.0 Verify all fixes work together
  - [x] 4.1 Run all three test files in sequence
    - Execute: `npm run test -- __tests__/components/ReviewImageTemplate.test.tsx __tests__/api/admin/resync.test.ts __tests__/integration/share-e2e.test.ts`
    - All 10 previously failing tests should pass
  - [x] 4.2 Confirm no regressions in other tests
    - Verify no new failures introduced
    - Check that passing tests still pass

**Acceptance Criteria:**
- All 10 previously failing tests now pass
- No new test failures introduced
- Test files follow existing codebase patterns

## Execution Order

These task groups are **independent** and can be executed in any order or in parallel:

1. **Task Group 1** (ReviewImageTemplate) - Simplest fix, single line change
2. **Task Group 2** (Resync API) - Medium complexity, mock restructuring
3. **Task Group 3** (Share E2E) - Medium complexity, database cleanup
4. **Task Group 4** (Verification) - Must run after 1-3 complete

**Recommended approach**: Start with Task Group 1 (quick win), then tackle Groups 2 and 3 based on preference.

## Constraints

- Do NOT modify actual component/API code (only test files)
- Do NOT disable or skip any tests
- Do NOT add new test cases
- Do NOT modify jest.config.js or test setup files
- Do NOT add new dependencies
