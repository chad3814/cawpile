# Specification: Review Text Box

## Goal
Add an optional review text box to the CAWPILE rating wizard's Additional Details section, allowing users to write qualitative reviews (up to 5,000 characters) that complement the quantitative rating system and can be displayed in book details and shared reviews.

## User Stories
- As a reader, I want to write a text review alongside my CAWPILE rating so that I can capture my qualitative thoughts about the book
- As a user viewing my book details, I want to see my review text displayed prominently so that I can easily recall my thoughts about the book

## Specific Requirements

**Add Review Textarea to Additional Details Wizard**
- Insert new step in AdditionalDetailsWizard between existing diversity tracking fields
- Plain textarea component (no rich text editor)
- 5,000 character maximum limit with live character counter
- Display counter showing remaining characters (e.g., "4,750 / 5,000")
- Field is completely optional with no validation requirements
- Textarea should be 6-8 rows tall for comfortable writing

**Character Counter Implementation**
- Display character count as "X / 5,000" format
- Update count in real-time as user types
- Use gray text when under limit, orange warning when approaching limit (>4,500 chars)
- Prevent text entry when 5,000 character limit reached
- Counter positioned below textarea, right-aligned

**Integration with Additional Details Step Flow**
- Add review step as new step in 4-step wizard (making it 5 steps total)
- Position review step after representation fields, before completion
- Update step counter to show correct total (Step X of 5)
- Update progress bar calculation to include new step
- Maintain existing Skip All functionality

**Database Integration (No Migration Required)**
- Use existing UserBook.review field (String?, @db.Text)
- Field already exists in schema, no migration needed
- Store plain text review content
- Allow null values for empty reviews

**Display in Book Details Modal**
- Add new "Review" section in BookDetailsModal after notes section
- Display review text with whitespace-pre-wrap formatting
- Section header: "My Review"
- Only show section if review text exists (hide when null/empty)
- Use same styling pattern as existing notes section

**Integration with Edit Book Functionality**
- Include review field in PATCH /api/user/books/[id] request (already supported)
- Review persists when book status changes
- Review can be updated through any edit flow
- Review retained when moving between READING, COMPLETED, DNF statuses

**Integration with Shared Reviews**
- Review text automatically included in shared reviews when present
- No additional privacy toggle needed (follows existing share visibility)
- Display review in shared review page after rating details
- Section header: "Review" in shared view
- Only show review section if text exists

**Validation and Edge Cases**
- Accept empty/null review (completely optional)
- Trim whitespace from beginning and end before saving
- Preserve internal whitespace and line breaks
- No profanity filtering or content moderation
- Character limit enforced client-side and server-side
- Handle special characters and unicode properly

**Accessibility Requirements**
- Textarea must have proper aria-label
- Character counter must be announced to screen readers
- Keyboard navigation support (Tab to enter/exit field)
- Error state announcement if character limit exceeded

**Character Limit Enforcement**
- Client-side: maxLength attribute on textarea
- Client-side: JavaScript validation before form submission
- Server-side: Validate in API route before database write
- Return 400 error if exceeds 5,000 characters

## Visual Design

No visual mockups provided. Follow existing design patterns from AdditionalDetailsWizard and other form fields.

**Textarea Styling**
- Use existing form input styles from TailwindCSS theme
- Border: border-gray-300 dark:border-gray-600
- Background: bg-white dark:bg-gray-700
- Text: text-gray-900 dark:text-gray-100
- Rounded corners with focus ring (focus:ring-orange-500)
- Padding: px-3 py-2

**Character Counter Styling**
- Text size: text-xs
- Normal state: text-gray-500 dark:text-gray-400
- Warning state (>4,500 chars): text-orange-600 dark:text-orange-400
- Position: mt-1 text-right

**Display in Book Details**
- Match existing notes section styling
- Header: font-semibold text-gray-900 dark:text-gray-100 mb-2
- Content: text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap
- Margin: Same spacing as other sections (space-y-4 pattern)

## Existing Code to Leverage

**AdditionalDetailsWizard Component**
- Multi-step wizard pattern with progress indicator and step navigation
- Existing form state management with useState hooks
- Previous/Next/Complete button pattern already implemented
- Step rendering switch statement for adding new step
- Can extend totalSteps from 4 to 5 and add new case to renderStep()

**Headless UI Dialog Pattern**
- Transition animations and modal overlay already configured
- Close handlers with escape key support implemented
- Consistent modal styling across all dialogs in application

**Character Counter Pattern from Other Fields**
- RepresentationField uses maxLength with detail input (500 chars)
- Similar pattern can be adapted for 5,000 character limit
- Character counting logic can reuse existing patterns from details fields

**API Route Structure**
- PATCH /api/user/books/[id]/route.ts already accepts review field (line 27, 108)
- No API modifications needed, field already supported
- Review field properly typed in request body interface

**BookDetailsModal Display Pattern**
- Notes section provides exact pattern for review display (lines 208-217)
- Conditional rendering with whitespace-pre-wrap formatting
- Consistent section header and content styling available to replicate

## Out of Scope
- Rich text formatting (bold, italic, links)
- Markdown support or preview
- Review editing in a dedicated modal (use existing Edit Book flow)
- Review versioning or edit history
- AI-assisted review writing or suggestions
- Review templates or prompts
- Spell checking or grammar checking
- Word count (only character count)
- Review privacy toggle (follows existing share settings)
- Public review feed or discovery
