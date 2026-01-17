# Spec Requirements: Fix Failing Integration Test - Share E2E

## Initial Description
Fix the failing test in `__tests__/integration/share-e2e.test.ts`. The specific error:
- Test: "Edge Case: Book Without Rating > should return 400 when attempting to share book without CAWPILE rating"
- Error: `PrismaClientKnownRequestError: Foreign key constraint violated on the constraint: UserBook_editionId_fkey`
- Location: Line 323 in the test file

## Requirements Discussion

### Analysis (No Questions Needed)

This is a straightforward test infrastructure bug that does not require user clarification. The root cause is identifiable from code analysis:

**Error Location:** Line 323 in `__tests__/integration/share-e2e.test.ts`

**Code at Error:**
```typescript
const userBookNoRating = await prisma.userBook.create({
  data: {
    userId: testUserId,
    editionId: edition2.id,  // <-- Foreign key constraint fails here
    status: 'COMPLETED',
    format: ['EBOOK'],
  },
})
```

**Root Cause Analysis:**

The foreign key constraint `UserBook_editionId_fkey` fails because `edition2.id` references an Edition that doesn't exist in the database at the time of UserBook creation.

Possible causes:
1. **Test isolation issue**: The `afterAll` cleanup from a previous test run may have deleted the parent `Book` record, causing the `Edition` creation at line 316-320 to fail (since Edition has a foreign key to Book via `bookId`)
2. **Parallel test execution**: If Jest runs tests in parallel, the shared `testBookId` may be deleted by another test's cleanup
3. **Database state pollution**: Previous test run may have left partial data that conflicts with new test data creation

**Evidence from Schema:**
- `Edition` model (lines 82-100 in schema.prisma): `book Book @relation(fields: [bookId], references: [id])`
- `UserBook` model (lines 120-160): `edition Edition @relation(fields: [editionId], references: [id])`
- The constraint chain is: UserBook -> Edition -> Book

**The Fix Pattern:**
The test's "Edge Case: Book Without Rating" (lines 313-363) needs proper test isolation:
1. Either create its own independent Book/Edition chain
2. Or ensure the parent data exists before creating dependent records
3. Add proper error handling around the edition/userBook creation

### Existing Code to Reference

**Primary File to Fix:**
- Path: `__tests__/integration/share-e2e.test.ts`
- Specific area: Lines 313-363 (Edge Case: Book Without Rating test)

**Related Schema:**
- Path: `prisma/schema.prisma`
- Models: Edition (lines 82-100), UserBook (lines 120-160)

**Test Setup Pattern:**
- The `beforeAll` block (lines 32-103) shows the correct pattern for creating related data
- The `afterAll` block (lines 105-129) shows cleanup order (respects foreign key dependencies)

### Follow-up Questions

None required. This is a clear test infrastructure bug with an identifiable root cause.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - This is a code/test fix, not a UI feature.

## Requirements Summary

### Functional Requirements
- Fix the "Edge Case: Book Without Rating" test so it passes consistently
- Ensure proper test isolation (test creates its own complete data chain)
- Maintain proper cleanup to avoid database pollution

### Reusability Opportunities
- Follow the existing pattern from `beforeAll` for creating test data chains (Book -> Edition -> UserBook)
- Use the same cleanup pattern from `afterAll` that respects foreign key order

### Scope Boundaries
**In Scope:**
- Fix the specific failing test in `__tests__/integration/share-e2e.test.ts`
- Ensure test isolation for the "Edge Case: Book Without Rating" test block

**Out of Scope:**
- Changes to application code (this is purely a test fix)
- Changes to other test files
- Changes to database schema
- Adding new tests

### Technical Considerations
- Foreign key constraint order: Book -> Edition -> UserBook
- Cleanup must happen in reverse order: UserBook -> Edition -> Book
- The test should create an independent Book/Edition specifically for the no-rating test case rather than reusing `testBookId` which may be cleaned up unpredictably
- Consider using `beforeEach`/`afterEach` within the specific describe block for better isolation
