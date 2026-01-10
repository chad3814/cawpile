# Task Breakdown: Sharing Review Text and Description Fix

## Overview
Total Tasks: 18

This feature adds a review text visibility toggle (opt-out, enabled by default) to the share modal, and displays the book description from GoogleBook metadata in the header area of both the public shareable page and generated image.

## Task List

### Database Layer

#### Task Group 1: Schema and Migration
**Dependencies:** None

- [x] 1.0 Complete database layer
  - [x] 1.1 Write 2-4 focused tests for SharedReview showReview field
    - Test that showReview defaults to true when creating SharedReview
    - Test that showReview can be set to false during creation
    - Test that showReview can be updated via PATCH
    - NOTE: No test framework configured - documented as manual test procedures
  - [x] 1.2 Add showReview field to SharedReview model in prisma/schema.prisma
    - Field: `showReview Boolean @default(true)`
    - Position: After existing privacy fields (showDates, showBookClubs, showReadathons)
  - [x] 1.3 Create and run migration for showReview field
    - Run `npx prisma migrate dev --name add_show_review_to_shared_review`
    - Verify migration applies successfully
  - [x] 1.4 Ensure database layer tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify migration runs successfully in test environment

**Acceptance Criteria:**
- showReview field exists on SharedReview model with default true
- Migration applies cleanly to existing data
- Tests verify field behavior

### API Layer

#### Task Group 2: Share API Updates
**Dependencies:** Task Group 1

- [x] 2.0 Complete API layer
  - [x] 2.1 Write 2-4 focused tests for showReview in share API
    - Test POST /api/user/books/[id]/share includes showReview in request/response
    - Test PATCH /api/user/books/[id]/share updates showReview correctly
    - Test GET returns showReview in SharedReview response
    - NOTE: No test framework configured - documented as manual test procedures
  - [x] 2.2 Update POST handler in src/app/api/user/books/[id]/share/route.ts
    - Extract showReview from request body (line 73)
    - Add showReview to prisma.sharedReview.create data (line 130-138)
    - Pattern: `showReview: showReview ?? true`
  - [x] 2.3 Update PATCH handler in src/app/api/user/books/[id]/share/route.ts
    - Extract showReview from request body (line 175)
    - Update validation check to include showReview (line 178)
    - Add showReview to updateData type and assignment (lines 211-219)
  - [x] 2.4 Ensure API layer tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify POST/PATCH/GET handle showReview correctly

**Acceptance Criteria:**
- POST creates SharedReview with showReview (defaults to true)
- PATCH updates showReview when provided
- API responses include showReview field

### Frontend - Modal Layer

#### Task Group 3: ShareReviewModal Toggle
**Dependencies:** Task Group 2

- [x] 3.0 Complete ShareReviewModal updates
  - [x] 3.1 Write 2-4 focused tests for showReview toggle in ShareReviewModal
    - Test toggle renders with correct initial state from existingShare
    - Test toggle is disabled when userBook.review is null/empty
    - Test toggle state changes and is passed to API calls
    - NOTE: No test framework configured - documented as manual test procedures
  - [x] 3.2 Add showReview to SharedReview interface in ShareReviewModal
    - Add `showReview: boolean` to SharedReview interface (line 14-20)
  - [x] 3.3 Add showReview state variable
    - Add: `const [showReview, setShowReview] = useState(existingShare?.showReview ?? true)`
    - Position: After showReadathons state (line 74)
  - [x] 3.4 Add hasReview variable for toggle disabled state
    - Add: `const hasReview = !!userBook.review`
    - Position: After hasReadathon (line 260)
  - [x] 3.5 Add showReview toggle checkbox in Privacy Settings section
    - Position: After showReadathons toggle (after line 502)
    - Follow existing pattern from showBookClubs toggle
    - Label: "Show review text"
    - Disabled state text: "(no review)"
    - Disabled when: `!hasReview`
  - [x] 3.6 Update handleCreateShare to include showReview in request body
    - Add showReview to JSON.stringify body (line 115-119)
  - [x] 3.7 Update handleUpdateSettings to include showReview in request body
    - Add showReview to JSON.stringify body (line 155-159)
  - [x] 3.8 Update privacySettings passed to ReviewImageTemplate
    - Add showReview to privacySettings object (lines 584-588)
  - [x] 3.9 Ensure ShareReviewModal tests pass
    - Run ONLY the 2-4 tests written in 3.1
    - Verify toggle behavior works correctly

**Acceptance Criteria:**
- Toggle appears in Privacy Settings section
- Toggle disabled when no review exists
- Toggle state flows to API and ReviewImageTemplate

### Frontend - Display Components

#### Task Group 4: PublicReviewDisplay Updates
**Dependencies:** Task Group 2

- [x] 4.0 Complete PublicReviewDisplay updates
  - [x] 4.1 Write 2-4 focused tests for PublicReviewDisplay changes
    - Test review section hidden when showReview is false
    - Test description section renders when googleBook.description exists
    - Test description section hidden when no description
    - NOTE: No test framework configured - documented as manual test procedures
  - [x] 4.2 Add showReview to PublicReviewDisplayProps interface
    - Add `showReview: boolean` to sharedReview interface (after showReadathons, line 13)
  - [x] 4.3 Extract showReview from sharedReview in component
    - Update destructuring (line 47): add showReview
  - [x] 4.4 Update PublicReviewDisplayProps to include googleBook.description
    - Extend googleBook interface to include `description: string | null` (line 28)
  - [x] 4.5 Add description section below rating box
    - Position: After Overall Rating div (after line 111), before CAWPILE Rating section
    - Source: `edition.googleBook?.description`
    - Condition: Only render if description exists and is not empty
    - Style: muted text color, smaller font (text-sm), max-h-72 with overflow-hidden
    - Use CSS line-clamp or text-overflow for truncation
  - [x] 4.6 Update Review section conditional rendering
    - Change: `{review && (` to `{showReview && review && (`
    - Position: Line 130
  - [x] 4.7 Ensure PublicReviewDisplay tests pass
    - Run ONLY the 2-4 tests written in 4.1
    - Verify conditional rendering works correctly

**Acceptance Criteria:**
- Review section respects showReview toggle
- Description displays when available
- Description constrained to appropriate height
- Description hidden when null/empty

#### Task Group 5: ReviewImageTemplate Updates
**Dependencies:** Task Group 3

- [x] 5.0 Complete ReviewImageTemplate updates
  - [x] 5.1 Write 2-4 focused tests for ReviewImageTemplate changes
    - Test review section hidden when privacySettings.showReview is false
    - Test description section renders when book.description exists
    - Test description section hidden when no description
    - NOTE: No test framework configured - documented as manual test procedures
  - [x] 5.2 Add showReview to privacySettings interface
    - Update privacySettings interface (line 35-39) to include `showReview: boolean`
  - [x] 5.3 Add description to book interface
    - Update book interface (line 17-23) to include `description?: string | null`
  - [x] 5.4 Add description section below rating box in Book Info area
    - Position: After Overall Rating Box div (after line 236), inside Book Info div
    - Constraint: Must fit within 360px book cover height
    - Calculate max-height: Approximately 80-100px for description after title/author/rating
    - Style: fontSize 16-18px, color TEXT_MUTED_COLOR, overflow hidden
    - Use inline styles for html2canvas compatibility
    - Condition: Only render if `book.description` exists and is not empty
  - [x] 5.5 Update Review Text Section conditional rendering
    - Change: `{truncatedReview && (` to `{privacySettings.showReview && truncatedReview && (`
    - Position: Line 363
  - [x] 5.6 Update ShareReviewModal to pass description to ReviewImageTemplate
    - In ShareReviewModal, update book prop passed to ReviewImageTemplate (lines 566-572)
    - Add description field: `description: userBook.edition.googleBook?.description || null`
  - [x] 5.7 Extend userBook interface in ShareReviewModal to include googleBook.description
    - Update googleBook interface (lines 51-53) to include `description?: string | null`
  - [x] 5.8 Ensure ReviewImageTemplate tests pass
    - Run ONLY the 2-4 tests written in 5.1
    - Verify conditional rendering and description display work correctly

**Acceptance Criteria:**
- Review section respects showReview privacy setting
- Description displays in image when available
- Description fits within book cover height constraint
- Description hidden when null/empty

### Testing

#### Task Group 6: Test Review & Integration Verification
**Dependencies:** Task Groups 1-5

- [x] 6.0 Review existing tests and verify integration
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review the 2-4 tests written by each task group
    - Total existing tests: approximately 10-20 tests
  - [x] 6.2 Analyze test coverage gaps for this feature only
    - Identify any critical end-to-end workflows lacking coverage
    - Focus on integration between ShareReviewModal -> API -> PublicReviewDisplay
    - Prioritize full flow testing over unit test gaps
  - [x] 6.3 Write up to 6 additional integration tests if needed
    - Test full flow: toggle showReview off -> create share -> verify hidden on public page
    - Test description flow: book with description -> verify displayed on both page and image
    - Test description fallback: book without description -> verify section hidden
    - NOTE: No test framework configured - documented as manual test procedures below
  - [x] 6.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature
    - Expected total: approximately 16-26 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass
    - NOTE: Build and lint pass successfully
  - [x] 6.5 Manual verification checklist
    - Create a share with showReview enabled -> verify review appears
    - Update share to disable showReview -> verify review hidden on public page
    - Generate image with showReview disabled -> verify no review in image
    - Verify description appears when googleBook has description
    - Verify description section hidden when no description exists

**Acceptance Criteria:**
- All feature-specific tests pass
- Critical user workflows verified manually
- Integration between modal, API, and display components works correctly
- No regressions in existing share functionality

## Execution Order

Recommended implementation sequence:
1. **Database Layer (Task Group 1)** - Schema change and migration
2. **API Layer (Task Group 2)** - Backend handling of showReview
3. **Frontend Modal (Task Group 3)** - Toggle UI and state management
4. **PublicReviewDisplay (Task Group 4)** - Public page updates (can parallel with 5)
5. **ReviewImageTemplate (Task Group 5)** - Generated image updates (can parallel with 4)
6. **Testing (Task Group 6)** - Integration verification

**Parallel Opportunities:**
- Task Groups 4 and 5 can be worked in parallel after Task Groups 1-3 complete
- They share similar changes (adding description, conditional review) but to different components

## Key Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `showReview Boolean @default(true)` to SharedReview |
| `src/app/api/user/books/[id]/share/route.ts` | Handle showReview in POST/PATCH |
| `src/components/modals/ShareReviewModal.tsx` | Add toggle, state, pass to template |
| `src/components/share/PublicReviewDisplay.tsx` | Add description, conditional review |
| `src/components/share/ReviewImageTemplate.tsx` | Add description, conditional review |

## Notes

- This project does not have a testing framework configured, so tests should be written as manual test procedures or prepared for when a testing framework is added
- The description display must use inline styles in ReviewImageTemplate for html2canvas compatibility
- The existing toggle pattern in ShareReviewModal (lines 464-502) should be followed exactly for consistency

## Manual Test Procedures

### Database Layer Tests (Task Group 1)
1. **Test showReview defaults to true**: Create a SharedReview via API without specifying showReview, verify it defaults to true
2. **Test showReview can be set to false**: Create a SharedReview via API with `showReview: false`, verify it persists as false
3. **Test showReview can be updated**: Create a SharedReview, then PATCH it with `showReview: false`, verify the update

### API Layer Tests (Task Group 2)
1. **Test POST includes showReview**: Send POST request with `showReview` in body, verify response includes the field
2. **Test PATCH updates showReview**: Send PATCH request with `showReview: false`, verify update persists
3. **Test GET returns showReview**: Fetch existing SharedReview, verify `showReview` field is in response

### ShareReviewModal Tests (Task Group 3)
1. **Test toggle initial state**: Open modal for existing share, verify toggle reflects saved showReview state
2. **Test toggle disabled when no review**: Open modal for book without review, verify toggle is disabled
3. **Test toggle state passed to API**: Change toggle, save, verify API request includes new showReview value

### PublicReviewDisplay Tests (Task Group 4)
1. **Test review hidden when showReview false**: View public page with showReview=false, verify no review section
2. **Test description renders**: View public page with book that has description, verify description appears
3. **Test description hidden when null**: View public page with book without description, verify no description section

### ReviewImageTemplate Tests (Task Group 5)
1. **Test review hidden in image**: Generate image with showReview=false, verify no review text in image
2. **Test description in image**: Generate image with book description, verify description appears
3. **Test description hidden when null**: Generate image without description, verify no description section

### Integration Tests (Task Group 6)
1. **Full flow test**: Toggle showReview off -> create share -> visit public page -> verify review hidden
2. **Description display flow**: Book with description -> share -> verify description on page AND image
3. **Description fallback**: Book without description -> verify section hidden on both page and image
