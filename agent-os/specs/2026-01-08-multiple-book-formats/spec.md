# Specification: Multiple Book Formats

## Goal
Enable users to track multiple formats for a single book (e.g., audiobook + physical), with new chart categories for multi-format combinations like "Double Dorking" (audio + physical/ebook), "Four Eyes" (physical + ebook), and "Omni Dorking" (3+ formats).

## User Stories
- As a reader who owns both audiobook and hardcover versions, I want to track both formats so that my library accurately reflects my collection
- As a data-driven reader, I want to see how many books I "double dork" on in my format distribution chart so that I can understand my purchasing patterns

## Specific Requirements

**Database Schema Migration**
- Change `UserBook.format` from single `BookFormat` enum to `BookFormat[]` array
- Migrate existing single-format data to array format (e.g., `HARDCOVER` → `[HARDCOVER]`)
- Maintain backward compatibility during migration with default value of empty array and validation
- No changes to unique constraints (userId, editionId pair remains unique)
- Update TypeScript types to reflect `format: BookFormat[]` throughout codebase

**Add to Library Wizard Format Selection**
- Convert step 1 format selection from radio buttons to checkbox-based multi-select
- Allow selection of any combination: HARDCOVER, PAPERBACK, EBOOK, AUDIOBOOK
- Require at least one format to be selected before proceeding to next step
- Maintain wizard flow structure with progress indicator
- Preserve existing dark mode styling and orange accent colors
- Submit format array to `POST /api/user/books` endpoint

**Change Format Modal Multi-Select**
- Convert existing RadioGroup to multi-select pattern using Headless UI
- Maintain icon-based card design with emoji icons (📖 📗 📱 🎧)
- Show orange border and checkmark on all selected formats (not just one)
- Allow toggling formats on/off with click interaction
- Update "Save Changes" button to be enabled when format array differs from current
- Submit format array to `PATCH /api/user/books/[id]` endpoint

**Edit Details Modal Format Field**
- Replace dropdown select with multi-select checkbox group or card-based selector
- Match visual pattern from Change Format modal for consistency
- Display in Basic Info tab alongside status field
- Enable save button when format selection changes
- Submit format array via existing PATCH endpoint

**Format Category Logic**
- Implement server-side categorization function that evaluates format arrays
- Category priority order (highest to lowest): Omni Dorking → Double Dorking → Four Eyes → Single Format
- **Omni Dorking**: 3 or more formats selected
- **Double Dorking**: AUDIOBOOK + (HARDCOVER OR PAPERBACK OR EBOOK), exactly 2 formats
- **Four Eyes**: (HARDCOVER OR PAPERBACK) + EBOOK (no audiobook), exactly 2 formats
- **Single Format**: Only one format selected, use that format name (Hardcover, Paperback, E-book, Audiobook)
- Create utility function `categorizeBookFormat(formats: BookFormat[]): string` in `src/lib/charts/`

**Book Format Chart API Updates**
- Modify `GET /api/charts/book-format` to use new categorization logic
- Return category names instead of raw format values in chart data
- Each book counted once in its most specific category (no double-counting)
- Maintain existing year filtering and sorting by count descending
- Update response type to include new category names

**Format Filtering Behavior**
- Books with multiple formats appear in ALL applicable format filters
- Example: Book with [AUDIOBOOK, HARDCOVER] appears in both "Audiobook" and "Physical" filters
- Update dashboard filtering logic to use `array.includes()` instead of exact match
- Physical filter matches books containing HARDCOVER or PAPERBACK
- Ebook filter matches EBOOK, Audiobook filter matches AUDIOBOOK

**API Endpoint Modifications**
- `POST /api/user/books`: Accept `format: BookFormat[]` in request body, validate array has at least one value
- `PATCH /api/user/books/[id]`: Accept `format: BookFormat[]` for updates
- Both endpoints validate format array contains only valid BookFormat enum values
- Return updated UserBook with format array in response
- Maintain existing validation for other fields

**TypeScript Type Updates**
- Update `UserBook` type to have `format: BookFormat[]`
- Update form data interfaces in wizard and modals to use `format: BookFormat[]`
- Update chart data types to return category strings
- Ensure strict type checking for format array operations throughout

**Validation Rules**
- Format array must contain at least one valid BookFormat enum value
- Format array cannot contain duplicates
- Format array cannot be null or undefined (must be empty array minimum)
- Client-side validation prevents form submission without at least one format
- Server-side validation returns 400 error for invalid format arrays

**Edge Cases Handled**
- Empty format array defaults to [PAPERBACK] on client validation
- Duplicate formats in array are filtered before database save
- Migration handles null/undefined existing formats by setting to [PAPERBACK]
- If user deselects all formats, validation requires at least one before save
- Physical format variations (both HARDCOVER and PAPERBACK) are allowed and counted as 2+ formats

## Visual Design

**`planning/visuals/current-add-to-library-dialog.png`**
- Step 1 contains simple radio button format selection that needs conversion to checkboxes
- Maintain clean vertical layout with consistent spacing
- Keep progress indicator bar at top showing current step
- Preserve dark mode theme with card background and border styling
- Replace radio inputs with checkboxes that allow multiple selections

**`planning/visuals/current-change-format-dialog.png`**
- Large icon-based cards with emoji icons, format name, and description
- Currently uses orange border and checkmark for single selection
- Extend to show multiple selections with same visual treatment
- Maintain card hover states and focus rings for accessibility
- Keep modal width at max-w-md and centered positioning
- Update subtitle text from "Select the format" to "Select the format(s)" to indicate multi-select

**`planning/visuals/current-edit-details-dialog.png`**
- Basic Info tab shows dropdown for format selection
- Replace dropdown with card-based multi-select matching Change Format modal pattern
- Maintain tab structure (Basic Info, Tracking, Additional Details)
- Keep form field spacing and label styling consistent
- Ensure multi-select field fits within tab content area without overflow

**`planning/visuals/current-format-pie-chart.png`**
- Simple Recharts pie chart with legend showing format names and percentages
- Add new category labels: "Double Dorking", "Four Eyes", "Omni Dorking"
- Existing single format labels remain: "Hardcover", "Paperback", "E-book", "Audiobook"
- May need to adjust legend layout if category names cause text overflow
- Maintain existing color palette and percentage display

## Existing Code to Leverage

**ChangeFormatModal.tsx (lines 85-139)**
- Headless UI RadioGroup with icon-based card pattern that can be adapted to multi-select
- CheckCircleIcon component and orange accent styling already implemented
- Card hover states and focus rings for accessibility already working
- Can reuse formatOptions array structure with emoji icons and descriptions
- Transition animations and modal backdrop already configured

**AddBookWizard.tsx (lines 269-290)**
- Step 1 format selection with radio buttons that needs checkbox conversion
- Form state management pattern using useState hook can extend to array
- Wizard navigation and progress indicator logic is reusable
- Existing validation pattern can be extended for "at least one format" rule

**EditBookModal.tsx (lines 280-295)**
- Basic Info tab with dropdown format selector that needs replacement
- Tab switching logic and form state management already implemented
- Can adapt to use same card-based multi-select pattern as Change Format modal
- Existing save handler and API integration can accept format array

**Book format chart API (route.ts lines 35-45)**
- Existing format counting logic using `formatCounts` object
- Current implementation counts single formats, can be extended with categorization function
- Chart data formatting to Recharts-compatible array structure already working
- Year filtering and sorting logic is reusable

**Prisma schema UserBook model (lines 118-158)**
- Current `format BookFormat` field needs migration to `BookFormat[]`
- Existing unique constraint on (userId, editionId) prevents duplicate tracking
- Relationship to Edition and User models unchanged
- Can reference migration patterns from other array fields like Book.authors

## Out of Scope
- Format-specific notes or annotations beyond the format selection itself
- Purchase price tracking per format or acquisition cost analysis
- Reading sessions tied to specific formats (progress remains unified across all formats)
- Format-specific start/end dates (dates remain book-level, not format-level)
- Separate progress tracking per format (one progress bar for the book regardless of formats)
- Format recommendations or suggestions based on reading patterns
- Format comparison features or analytics beyond the chart categories
- Historical tracking of format changes over time
- Import/export of format data separately from book data
- Format-specific reminders or notifications
- Any modifications to the Edition.format field (remains single format for metadata purposes)
