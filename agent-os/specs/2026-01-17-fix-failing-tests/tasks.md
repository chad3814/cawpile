# Task Breakdown: Fix Failing Integration Test - Share E2E

## Overview
Total Tasks: 3

## Problem Summary
The "Edge Case: Book Without Rating" test (lines 313-363) fails with `Foreign key constraint violated on the constraint: UserBook_editionId_fkey` because it reuses `testBookId` from the shared test data, which may be deleted by `afterAll` cleanup in parallel/sequential test runs.

## Task List

### Test Infrastructure Fix

#### Task Group 1: Create Independent Test Data Chain
**Dependencies:** None

- [x] 1.0 Fix the "Edge Case: Book Without Rating" test
  - [x] 1.1 Create independent Book record before Edition creation
    - Add Book creation with unique nanoid identifier before line 316
    - Use same pattern from beforeAll (lines 44-51)
    - Fields: title (unique with nanoid), authors, bookType
  - [x] 1.2 Update Edition creation to reference new Book
    - Change `bookId: testBookId` to `bookId: newBook.id` at line 318
    - Keep existing isbn13 generation pattern
  - [x] 1.3 Update cleanup to delete in correct foreign key order
    - After line 361 (edition delete), add Book deletion
    - Final cleanup order: UserBook -> Edition -> Book

**Acceptance Criteria:**
- Test creates its own complete data chain: Book -> Edition -> UserBook
- Test does not reference shared `testBookId` variable
- Cleanup deletes all three records in reverse FK order
- Test passes when run in isolation and with full suite

#### Task Group 2: Verify Fix
**Dependencies:** Task Group 1

- [x] 2.0 Run tests to verify the fix
  - [x] 2.1 Run the specific failing test in isolation
    - Command: `npm test -- --testPathPatterns="share-e2e" --testNamePattern="Book Without Rating"`
  - [x] 2.2 Run full share-e2e test suite
    - Command: `npm test -- --testPathPatterns="share-e2e"`
  - [x] 2.3 Verify no other tests are affected
    - All tests in share-e2e.test.ts should pass

**Acceptance Criteria:**
- "Edge Case: Book Without Rating" test passes
- All other tests in the file continue to pass
- No foreign key constraint violations

## Execution Order

1. Task Group 1 - Fix the test data isolation issue
2. Task Group 2 - Verify the fix works

## Code Change Summary

**File:** `__tests__/integration/share-e2e.test.ts`
**Lines:** 313-363

**Before (problematic code):**
```typescript
const edition2 = await prisma.edition.create({
  data: {
    bookId: testBookId,  // <-- References shared test data
    isbn13: `979${nanoid(10)}`,
  },
})
```

**After (fixed code):**
```typescript
// Create independent Book for this test
const bookNoRating = await prisma.book.create({
  data: {
    title: `No Rating Test Book ${nanoid(6)}`,
    authors: ['Test Author'],
    bookType: 'FICTION',
  },
})

const edition2 = await prisma.edition.create({
  data: {
    bookId: bookNoRating.id,  // <-- References test-specific Book
    isbn13: `979${nanoid(10)}`,
  },
})

// ... existing test logic ...

// Cleanup in reverse FK order
await prisma.userBook.delete({ where: { id: userBookNoRating.id } })
await prisma.edition.delete({ where: { id: edition2.id } })
await prisma.book.delete({ where: { id: bookNoRating.id } })  // <-- Added
```
