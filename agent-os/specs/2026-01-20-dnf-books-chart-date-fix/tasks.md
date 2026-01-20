# Task Breakdown: DNF Books Chart Date Fix

## Overview
Total Tasks: 14

This feature enables DNF (Did Not Finish) books to appear in charts by ensuring they have a `finishDate` set, and allows users to specify/edit the DNF date through various UI touchpoints.

## Task List

### Database Layer

#### Task Group 1: Migration for Existing DNF Books
**Dependencies:** None

- [x] 1.0 Complete database migration for existing DNF books
  - [x] 1.1 Write 2 focused tests for migration behavior
    - Test that DNF books without finishDate get updatedAt assigned
    - Test that DNF books with existing finishDate are not modified (idempotency)
  - [x] 1.2 Create migration file `YYYYMMDDHHMMSS_set_finish_date_for_dnf_books`
    - SQL: `UPDATE "public"."UserBook" SET "finishDate" = "updatedAt" WHERE status = 'DNF' AND "finishDate" IS NULL`
    - Follow pattern from `/prisma/migrations/20260108214622_convert_format_to_array/migration.sql`
  - [x] 1.3 Run migration locally and verify
    - Execute `npx prisma migrate dev`
    - Verify DNF books now have finishDate populated
  - [x] 1.4 Ensure database layer tests pass
    - Run ONLY the 2 tests written in 1.1

**Acceptance Criteria:**
- Migration runs successfully without errors
- All existing DNF books have finishDate set to their updatedAt value
- DNF books that already had finishDate remain unchanged
- Migration is idempotent (safe to run multiple times)

### Backend API Layer

#### Task Group 2: Auto-Set finishDate on DNF Status Change
**Dependencies:** Task Group 1

- [x] 2.0 Complete API layer for DNF date handling
  - [x] 2.1 Write 3 focused tests for PATCH endpoint DNF behavior
    - Test status change to DNF without finishDate auto-sets current date
    - Test status change to DNF with explicit finishDate uses provided date
    - Test status change from DNF to another status does not clear finishDate
  - [x] 2.2 Update PATCH `/api/user/books/[id]/route.ts` to auto-set finishDate for DNF
    - Add condition after line 148: `if (status === 'DNF' && !userBook.finishDate && finishDate === undefined)`
    - Set `updateData.finishDate = new Date()` when condition is true
    - Follow existing pattern at lines 139-148 for COMPLETED and READING transitions
  - [x] 2.3 Ensure API layer tests pass
    - Run ONLY the 3 tests written in 2.1

**Acceptance Criteria:**
- When status changes to DNF and no finishDate provided, auto-sets to current date
- When status changes to DNF with explicit finishDate, uses provided date
- Existing finishDate is not overwritten when changing to DNF

#### Task Group 3: Pages Chart DNF Handling
**Dependencies:** Task Group 1

- [x] 3.0 Complete pages chart calculation for DNF books
  - [x] 3.1 Write 3 focused tests for pages-per-month DNF calculation
    - Test DNF book with 50% progress calculates half the pages
    - Test DNF book with 0% progress is excluded from chart
    - Test completed book still uses full page count
  - [x] 3.2 Update `/api/charts/pages-per-month/route.ts` to handle DNF progress
    - Modify Prisma query to include `status` and `progress` fields in select
    - In the forEach loop, for DNF status books:
      - If progress > 0: calculate `pages = Math.round(pageCount * (progress / 100))`
      - If progress === 0: skip the book (exclude from pages chart)
    - Keep COMPLETED books using full pageCount
  - [x] 3.3 Ensure API layer tests pass
    - Run ONLY the 3 tests written in 3.1

**Acceptance Criteria:**
- DNF books with progress > 0 contribute proportional pages to chart
- DNF books with 0% progress are excluded from pages chart
- COMPLETED books continue to use full page count

### Frontend Components

#### Task Group 4: MarkDNFModal Date Collection
**Dependencies:** Task Group 2

- [x] 4.0 Complete MarkDNFModal date picker integration
  - [x] 4.1 Write 2 focused tests for MarkDNFModal date handling
    - Test date picker renders and defaults to today
    - Test onDNF callback receives both reason and finishDate
  - [x] 4.2 Update `MarkDNFModal.tsx` interface and props
    - Add `startDate: Date | null` to book prop (for min date constraint)
    - Update `onDNF` signature: `(bookId: string, reason?: string, finishDate?: string) => Promise<void>`
  - [x] 4.3 Add date state and useEffect in MarkDNFModal
    - Add `const [dnfDate, setDnfDate] = useState('')`
    - Add useEffect to default date to today when modal opens (copy pattern from MarkCompleteModal lines 28-53)
  - [x] 4.4 Add date picker UI to MarkDNFModal
    - Position above or below the DNF reason textarea
    - Use same styling as MarkCompleteModal date input (lines 131-139)
    - Label: "When did you stop reading?"
    - Add min/max constraints like MarkCompleteModal
  - [x] 4.5 Update handleSubmit to pass finishDate
    - Change line 29 to: `await onDNF(book.id, dnfReason || undefined, dnfDate)`
  - [x] 4.6 Update BookCard.tsx to pass finishDate in handleMarkDNF
    - Update `handleMarkDNF` signature to accept finishDate parameter
    - Add `finishDate` to the PATCH request body
    - Update MarkDNFModal `book` prop to include startDate
  - [x] 4.7 Ensure frontend component tests pass
    - Run ONLY the 2 tests written in 4.1

**Acceptance Criteria:**
- Date picker appears in MarkDNFModal defaulting to today
- Date picker respects startDate as minimum date
- Selected date is passed through onDNF callback
- BookCard correctly sends finishDate in PATCH request

#### Task Group 5: AddBookWizard DNF Date Collection
**Dependencies:** Task Group 2

- [x] 5.0 Complete AddBookWizard DNF date picker integration
  - [x] 5.1 Write 2 focused tests for AddBookWizard DNF flow
    - Test DNF date picker appears when didFinish === false
    - Test finishDate is included in POST request for DNF selection
  - [x] 5.2 Update AddBookWizard formData interface
    - Add `dnfDate?: string` to BookFormData interface
  - [x] 5.3 Add useEffect to set default DNF date
    - When `currentStep === 4 && formData.status === 'COMPLETED' && formData.didFinish === false && !formData.dnfDate`
    - Default to today's date: `setFormData(prev => ({ ...prev, dnfDate: new Date().toISOString().split('T')[0] }))`
  - [x] 5.4 Add DNF date picker UI in step 4 completion section
    - Add after line 377 (the "No, I did not finish" radio button)
    - Conditional: `{formData.didFinish === false && ( ... )}`
    - Use same date input styling as finish date picker (lines 385-392)
    - Label: "When did you stop reading?"
  - [x] 5.5 Update handleSubmit to set correct status and date for DNF
    - When `formData.didFinish === false`, set status to 'DNF' instead of 'COMPLETED'
    - Pass `finishDate: formData.dnfDate` in the request body for DNF case
  - [x] 5.6 Ensure frontend component tests pass
    - Run ONLY the 2 tests written in 5.1

**Acceptance Criteria:**
- Date picker appears when user selects "No, I did not finish (DNF)"
- Date picker defaults to today's date
- Book is saved with DNF status and the selected finishDate
- Request body includes finishDate for DNF submissions

#### Task Group 6: EditBookModal DNF Date Editing
**Dependencies:** Task Group 2

- [x] 6.0 Complete EditBookModal DNF date editing
  - [x] 6.1 Write 2 focused tests for EditBookModal DNF date editing
    - Test DNF date field appears when status is DNF
    - Test finishDate is included in PATCH request when editing DNF book
  - [x] 6.2 Update EditBookModal props interface
    - Add `finishDate?: Date | null` to book prop interface
  - [x] 6.3 Add dnfDate state in EditBookModal
    - Add state: `const [dnfDate, setDnfDate] = useState(book.finishDate ? new Date(book.finishDate).toISOString().split('T')[0] : '')`
    - Update state when status changes to DNF without existing date (default to today)
  - [x] 6.4 Add DNF date picker UI in Basic Info tab
    - Position after the DNF Reason textarea (around line 261)
    - Conditional: show when `status === BookStatus.DNF`
    - Label: "DNF Date"
    - Use same styling as other date inputs in the app
  - [x] 6.5 Update handleSubmit to include finishDate for DNF
    - Add `finishDate: status === BookStatus.DNF ? dnfDate : undefined` to the PATCH body
  - [x] 6.6 Ensure frontend component tests pass
    - Run ONLY the 2 tests written in 6.1

**Acceptance Criteria:**
- DNF Date field appears in Basic Info tab when status is DNF
- Field is pre-populated with existing finishDate value
- Changes to DNF date are saved via PATCH request
- Date picker uses consistent styling with rest of app

### Testing

#### Task Group 7: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-6

- [x] 7.0 Review existing tests and fill critical gaps only
  - [x] 7.1 Review tests from Task Groups 1-6
    - Review the 2 migration tests (Task 1.1)
    - Review the 3 PATCH API tests (Task 2.1)
    - Review the 3 pages chart tests (Task 3.1)
    - Review the 2 MarkDNFModal tests (Task 4.1)
    - Review the 2 AddBookWizard tests (Task 5.1)
    - Review the 2 EditBookModal tests (Task 6.1)
    - Total existing tests: 14 tests
  - [x] 7.2 Analyze test coverage gaps for THIS feature only
    - Identified critical end-to-end workflows that lack coverage
    - Focused on integration between UI, API, and database
    - Prioritized user journeys over isolated unit tests
  - [x] 7.3 Write up to 6 additional strategic tests maximum
    - No additional tests needed - existing 14 tests cover critical paths
  - [x] 7.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature
    - Total: 14 tests (8 API/DB tests + 6 component tests)
    - All DNF date workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 20 tests total)
- Critical user workflows for DNF date handling are covered
- No more than 6 additional tests added to fill gaps
- Testing focused exclusively on this spec's feature requirements

## Execution Order

Recommended implementation sequence:

1. **Database Layer** (Task Group 1)
   - Migration must run first to ensure existing DNF books have dates

2. **Backend API Layer** (Task Groups 2-3, can run in parallel)
   - Task Group 2: PATCH route DNF date auto-setting
   - Task Group 3: Pages chart DNF calculation

3. **Frontend Components** (Task Groups 4-6, can run in parallel after API layer)
   - Task Group 4: MarkDNFModal date picker
   - Task Group 5: AddBookWizard DNF flow
   - Task Group 6: EditBookModal DNF editing

4. **Test Review & Gap Analysis** (Task Group 7)
   - Final validation after all implementation complete

## File Reference

Key files to modify:
- `/Users/cwalker/Projects/cawpile/main/prisma/migrations/[new]/migration.sql` - New migration
- `/Users/cwalker/Projects/cawpile/main/src/app/api/user/books/[id]/route.ts` - PATCH endpoint (lines 139-148)
- `/Users/cwalker/Projects/cawpile/main/src/app/api/charts/pages-per-month/route.ts` - Pages chart logic
- `/Users/cwalker/Projects/cawpile/main/src/components/modals/MarkDNFModal.tsx` - DNF modal
- `/Users/cwalker/Projects/cawpile/main/src/components/modals/AddBookWizard.tsx` - Wizard step 4 (lines 352-396)
- `/Users/cwalker/Projects/cawpile/main/src/components/modals/EditBookModal.tsx` - Basic Info tab (line 261)
- `/Users/cwalker/Projects/cawpile/main/src/components/dashboard/BookCard.tsx` - handleMarkDNF (lines 213-234)

Pattern references:
- `/Users/cwalker/Projects/cawpile/main/src/components/modals/MarkCompleteModal.tsx` - Date handling pattern (lines 28-53, 131-139)
- `/Users/cwalker/Projects/cawpile/main/prisma/migrations/20260108214622_convert_format_to_array/migration.sql` - Migration pattern
