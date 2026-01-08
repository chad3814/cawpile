# Spec Requirements: Multiple Book Formats

## Initial Description
Allow users to specify multiple formats for a tracked book. If a user has both audiobook and physical or ebook formats that is called "double dorking" and should show up as such in the "Book Format" chart.

## Requirements Discussion

### First Round Questions

**Q1: UI Pattern for Multi-Select** - Should the format selection UI be checkboxes (allowing multiple selections) instead of radio buttons, or do you prefer a different pattern?
**Answer:** Similar to current change format dialog - need to modify add to library and edit details dialogs to match.

**Q2: Format Category Logic** - How should "double dorking" be determined? Is it specifically Audiobook + (any physical/ebook), or are there different combinations?
**Answer:**
- Audio + (Hardcover OR Paperback OR eBook) = "Double Dorking"
- (Physical + eBook) without audio = "Four Eyes"
- More than two formats = "Omni Dorking"
- Single format = that format's category

**Q3: Chart Visualization** - Should books with multiple formats be counted once in a new "Double Dorking" category, or counted separately in each format category they belong to?
**Answer:** Each book counted ONCE only in the most specific category.

**Q4: Format Filtering** - When users filter by format (e.g., "show only audiobooks"), should books with multiple formats including audiobook appear in that filter?
**Answer:** Books with multiple formats appear in ALL format filters.

**Q5: Migration Strategy** - Should we migrate existing single-format books to this new multi-format field automatically?
**Answer:** Yes, migrate existing single-format books to multi-format field.

**Q6: Physical Format Variations** - Can a user select both "Hardcover" AND "Paperback" if they own multiple physical formats of the same book?
**Answer:** Yes, allow multiple physical formats (hardcover + paperback).

**Q7: Progress Tracking** - If a user has both audiobook and physical formats, do they track progress separately for each, or is there one unified progress tracker?
**Answer:** Single progress tied to the book regardless of format(s).

**Q8: Scope Boundaries** - Should this include any other features like format-specific notes, purchase tracking per format, or reading sessions tied to formats?
**Answer:** Multi-select format + new chart categories only.

### Existing Code to Reference
**Similar Features Identified:**
- Feature: Change Format Dialog - Path: Visual evidence shows existing single-select modal with format options
- Components to potentially reuse: Current format selection UI pattern (radio buttons → checkboxes conversion)
- Backend logic to reference: Book format pie chart already exists in charts API

### Follow-up Questions
None required - all requirements clarified.

## Visual Assets

### Files Provided:
- `current-add-to-library-dialog.png`: Shows the "Add to Library" wizard with a single-select format radio button group (Hardcover, Paperback, E-book, Audiobook) in step 1 of the wizard flow.
- `current-change-format-dialog.png`: Shows a standalone "Change Reading Format" modal with large, icon-based single-select format cards (Hardcover, Paperback, E-Book, Audiobook). Each card has an icon, title, and description. Currently selected format (E-Book) is highlighted with an orange border and checkmark icon.
- `current-edit-details-dialog.png`: Shows the "Edit Book Details" modal with a Basic Info tab containing a dropdown select for "Book Format" (currently showing "E-book"). This is a single-select dropdown component.
- `current-format-pie-chart.png`: Shows the existing "Book Format" pie chart with two segments - Audiobook (13%) and E-book (88%). Simple Recharts implementation with legend.

### Visual Insights:
- **Design Patterns**: Three distinct UI patterns for format selection exist:
  1. Simple radio buttons (Add to Library wizard)
  2. Large icon-based cards with descriptions (Change Format modal)
  3. Dropdown select (Edit Details modal)
- **User Flow**: The Change Format dialog pattern with icon-based cards is the most prominent and user-friendly pattern that should be adapted for multi-select.
- **UI Components**: Dark mode theme, consistent spacing, orange accent color for selected states, clear visual hierarchy.
- **Fidelity Level**: High-fidelity screenshots of existing production UI.

## Requirements Summary

### Functional Requirements

#### Format Selection
- Convert single-select format field to multi-select across all three UI locations:
  1. Add to Library wizard (step 1)
  2. Change Format modal
  3. Edit Details modal (Basic Info tab)
- Allow selection of any combination of formats: PHYSICAL (Hardcover), PHYSICAL (Paperback), EBOOK, AUDIOBOOK
- Enable users to select multiple physical formats (e.g., both Hardcover and Paperback)
- Maintain icon-based card design pattern from Change Format modal for consistency

#### Format Categories (Chart Logic)
Categorize books based on format combinations:
1. **Single Format Categories** (when only one format selected):
   - "Hardcover" (only hardcover)
   - "Paperback" (only paperback)
   - "E-book" (only ebook)
   - "Audiobook" (only audiobook)

2. **Combination Categories** (multiple formats):
   - **"Double Dorking"**: Audio + (Hardcover OR Paperback OR eBook)
   - **"Four Eyes"**: (Hardcover OR Paperback) + eBook (without audio)
   - **"Omni Dorking"**: More than two formats selected

#### Chart Visualization
- Each book counted ONCE in the most specific category (not duplicated across categories)
- Update existing Book Format pie chart to display new categories
- Categories should be ordered by specificity: Omni Dorking → Double Dorking → Four Eyes → Single formats

#### Format Filtering
- Books with multiple formats appear in ALL applicable format filters
- Example: A book with Audiobook + Hardcover appears when filtering for "Audiobook" AND when filtering for "Physical"

#### Progress Tracking
- Single unified progress tracker per book regardless of number of formats
- No format-specific progress tracking needed

### Reusability Opportunities
- Existing Change Format modal component structure can be adapted for multi-select
- Current format enum/types can be extended to support arrays
- Book format pie chart component already exists and can be updated with new categories
- Form field patterns from other multi-select fields (book clubs, readathons) may provide implementation guidance

### Scope Boundaries

**In Scope:**
- Convert format field from single value to array of values
- Update database schema (UserBook.format field)
- Migrate existing single-format data to array format
- Update Add to Library wizard format selection (step 1)
- Update Change Format modal to multi-select with icon cards
- Update Edit Details modal format field to multi-select
- Implement format category logic (Double Dorking, Four Eyes, Omni Dorking)
- Update Book Format pie chart with new categories
- Update format filtering to include books with multiple formats in all applicable filters
- Update all API endpoints to handle format arrays

**Out of Scope:**
- Format-specific notes or annotations
- Purchase tracking per format
- Reading sessions tied to specific formats
- Format-specific start/end dates
- Price tracking per format
- Separate progress tracking per format
- Any features beyond format selection and chart categories

### Technical Considerations

#### Database Changes
- **Migration Required**: Convert `UserBook.format` from single enum to array of enums
- **Data Migration**: Existing single-format books must be migrated to array format (e.g., `"PHYSICAL"` → `["PHYSICAL"]`)
- **Unique Constraint**: No impact - UserBook is still unique per (userId, editionId)

#### UI Component Updates
- **Pattern Consistency**: Use icon-based card pattern from Change Format modal across all three locations
- **State Management**: Multi-select requires array state instead of single value state
- **Visual Feedback**: Multiple selected cards should show orange border + checkmark (similar to current single-select)
- **Accessibility**: Checkboxes (or checkbox-like behavior) for screen reader support

#### Chart Logic Implementation
- **Category Calculation**: Server-side logic to determine category based on format array
- **Priority Order**: Omni Dorking > Double Dorking > Four Eyes > Single Format
- **Data Processing**: Update chart data API to return new categories
- **Legend Display**: May need to handle longer category names in pie chart legend

#### Integration Points
- `/api/user/books` POST endpoint (Add to Library)
- `/api/user/books/[id]` PATCH endpoint (Update format)
- `/api/charts/book-format` GET endpoint (Chart data)
- Dashboard book filtering logic
- SearchModal or AddBookWizard component
- ChangeFormatModal component
- EditBookDetailsModal component

#### Existing System Constraints
- NextAuth v5 authentication required for all operations
- Prisma ORM for database operations
- React 19 with TypeScript
- TailwindCSS 4 for styling
- Headless UI for modal components
- Recharts v3.2 for pie chart

#### Technology Preferences
- Follow existing modal patterns (Headless UI Dialog)
- Use existing icon library (Heroicons or current icon set)
- Maintain dark mode theme consistency
- Use optimistic UI updates where applicable
- TypeScript strict mode compliance
