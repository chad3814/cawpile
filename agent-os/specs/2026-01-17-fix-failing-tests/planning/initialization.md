# Initialization

## Spec Name
Fix Failing Integration Test - Share E2E

## Initial Description
Fix the failing test in `__tests__/integration/share-e2e.test.ts`. The specific error:
- Test: "Edge Case: Book Without Rating > should return 400 when attempting to share book without CAWPILE rating"
- Error: `PrismaClientKnownRequestError: Foreign key constraint violated on the constraint: UserBook_editionId_fkey`
- Location: Line 323 in the test file

## Context
This is a test infrastructure bug, not a product feature. The test is failing due to a foreign key constraint violation when creating test data.
