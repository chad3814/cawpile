# Development Plan - Enhanced Book Tracking Fields

**Session**: 2025-09-13-1111-add-more-tracking-data
**Date**: 2025-09-13

## Implementation Plan Overview

This plan breaks down the implementation into small, safe, iterative steps that build upon each other. Each phase is designed to be independently testable while contributing to the final feature set.

## Phase Breakdown

### Phase 1: Database Foundation
Set up the database schema for all new tracking fields without any UI changes.

### Phase 2: Type Definitions & API Layer
Create TypeScript types and update API endpoints to handle new fields.

### Phase 3: Book Addition Fields
Add the 4 fields that appear when adding a book (acquisition, book club, read-a-thon, re-read).

### Phase 4: DNF Reason Field
Implement the DNF reason field that appears when marking a book as DNF.

### Phase 5: Additional Details Wizard
Create the post-rating wizard for representation and author diversity fields.

### Phase 6: Edit Functionality
Enable editing of all tracking fields from the book details page.

### Phase 7: Autocomplete Features
Add autocomplete functionality for book club and read-a-thon names.

---

## Detailed Implementation Prompts

### **Prompt 1: Database Schema - Add Tracking Columns**

**Context**: We're adding enhanced tracking fields to the Cawpile book tracking application. Starting with database schema updates.

**Task**: Update the Prisma schema to add new tracking columns to the UserBook table. All fields should be nullable for backward compatibility.

Add the following fields to the UserBook model in prisma/schema.prisma:
- `acquisitionMethod` - String? (for values: Purchased, Library, FriendBorrowed, Gift)
- `acquisitionOther` - String? @db.VarChar(100) (for "Other" acquisition details)
- `bookClubName` - String? @db.VarChar(100)
- `readathonName` - String? @db.VarChar(100)
- `isReread` - Boolean? @default(false)
- `dnfReason` - String? @db.VarChar(500)
- `lgbtqRepresentation` - String? (for values: Yes, No, Unknown)
- `lgbtqDetails` - String? @db.VarChar(500)
- `disabilityRepresentation` - String? (for values: Yes, No, Unknown)
- `disabilityDetails` - String? @db.VarChar(500)
- `isNewAuthor` - Boolean?
- `authorPoc` - String? (for values: Yes, No, Unknown)
- `authorPocDetails` - String? @db.VarChar(200)

Generate and run a migration after updating the schema.

---

### **Prompt 2: Database Schema - Autocomplete Tables**

**Context**: Continuing database setup. We need tables to store user-specific book clubs and read-a-thons for autocomplete functionality.

**Task**: Create new Prisma models for storing user-specific book clubs and read-a-thons.

Add to prisma/schema.prisma:

1. Create a `UserBookClub` model with:
   - `id` - String @id @default(cuid())
   - `userId` - String (relation to User)
   - `name` - String @db.VarChar(100)
   - `lastUsed` - DateTime @default(now())
   - `usageCount` - Int @default(1)
   - Unique constraint on [userId, name]

2. Create a `UserReadathon` model with:
   - `id` - String @id @default(cuid())
   - `userId` - String (relation to User)
   - `name` - String @db.VarChar(100)
   - `lastUsed` - DateTime @default(now())
   - `usageCount` - Int @default(1)
   - Unique constraint on [userId, name]

3. Add relations to the User model.

Generate and run migration.

---

### **Prompt 3: Type Definitions**

**Context**: Database schema is ready. Now we need TypeScript type definitions for the new fields.

**Task**: Update TypeScript types to include new tracking fields.

1. Update the UserBook type in src/types/book.ts to include all new tracking fields
2. Create enum types for:
   - `AcquisitionMethod` (Purchased, Library, FriendBorrowed, Gift, Other)
   - `RepresentationValue` (Yes, No, Unknown)
3. Create interfaces for:
   - `BookTrackingData` - containing all the new tracking fields
   - `AdditionalDetailsData` - for the post-rating wizard fields

Ensure types match the Prisma schema exactly.

---

### **Prompt 4: API Endpoints - Update Book Operations**

**Context**: Types are defined. Now update API endpoints to handle new fields.

**Task**: Update the book creation and update API endpoints to accept and store new tracking fields.

1. Update POST /api/user/books endpoint to:
   - Accept acquisitionMethod, acquisitionOther, bookClubName, readathonName, isReread
   - Validate character limits
   - Store book club/read-a-thon names in autocomplete tables if provided

2. Update PUT /api/user/books/[id] endpoint to:
   - Accept all tracking fields
   - Handle DNF reason when status changes to DNF
   - Validate all character limits

3. Add validation using Zod schemas for all new fields.

---

### **Prompt 5: API Endpoints - Autocomplete Data**

**Context**: Need endpoints for autocomplete functionality.

**Task**: Create new API endpoints for fetching autocomplete suggestions.

1. Create GET /api/user/book-clubs endpoint:
   - Return user's previously used book club names
   - Sort by usage count and recency
   - Limit to top 10

2. Create GET /api/user/readathons endpoint:
   - Return user's previously used read-a-thon names
   - Sort by usage count and recency
   - Limit to top 10

---

### **Prompt 6: UI Components - Tracking Fields Component**

**Context**: APIs ready. Create reusable components for the new tracking fields.

**Task**: Create reusable form components for the tracking fields.

Create in src/components/forms/:

1. `AcquisitionMethodField.tsx`:
   - Radio group for acquisition methods
   - Show text input when "Other" selected
   - Character counter for Other field

2. `BookClubField.tsx`:
   - Checkbox for "Is this for a book club?"
   - Autocomplete input that appears when checked
   - Character counter

3. `ReadathonField.tsx`:
   - Checkbox for "Is this for a read-a-thon?"
   - Autocomplete input that appears when checked
   - Character counter

4. `RereadField.tsx`:
   - Simple checkbox for "Is this a re-read?"

All components should accept value and onChange props, be fully controlled.

---

### **Prompt 7: Book Addition Modal Integration**

**Context**: Form components created. Now integrate them into the book addition flow.

**Task**: Update the AddBookWizard component to include the 4 new tracking fields.

1. Locate the AddBookWizard component
2. Add a new step or extend existing step with:
   - AcquisitionMethodField
   - BookClubField (with autocomplete)
   - ReadathonField (with autocomplete)
   - RereadField
3. Update form state to include new fields
4. Pass new field values to the API when saving
5. Fields should be optional - allow skipping

---

### **Prompt 8: DNF Reason Implementation**

**Context**: Book addition fields complete. Now implement DNF reason field.

**Task**: Add DNF reason field when user changes status to DNF.

1. Update the status change component/modal
2. When status is changed to DNF, show:
   - Optional text area for DNF reason
   - Character counter (500 max)
   - "Why did you DNF this book? (optional)" label
3. Include dnfReason in API call when updating status
4. If changing from DNF to another status, clear the DNF reason

---

### **Prompt 9: Additional Details Wizard - Structure**

**Context**: Need post-rating wizard for representation fields.

**Task**: Create the Additional Details wizard structure.

Create src/components/modals/AdditionalDetailsWizard.tsx:

1. Multi-step wizard with 4 steps:
   - Step 1: LGBTQ+ Representation
   - Step 2: Disability Representation
   - Step 3: New Author
   - Step 4: Author Person of Color

2. Include:
   - Progress indicator
   - Next/Previous buttons
   - Skip All button
   - Save & Close on last step

3. Structure only - individual step components to follow.

---

### **Prompt 10: Additional Details - Representation Components**

**Context**: Wizard structure ready. Create the representation field components.

**Task**: Create components for representation tracking fields.

Create in src/components/forms/:

1. `LgbtqRepresentationField.tsx`:
   - Radio group: Yes/No/Unknown
   - Text area for details (always visible)
   - Character counter (500 max)

2. `DisabilityRepresentationField.tsx`:
   - Radio group: Yes/No/Unknown
   - Text area for details (always visible)
   - Character counter (500 max)

3. `AuthorPocField.tsx`:
   - Radio group: Yes/No/Unknown
   - Text input for nationality/ethnicity (always visible)
   - Character counter (200 max)

---

### **Prompt 11: Additional Details - Integration**

**Context**: All components ready. Wire up the Additional Details wizard.

**Task**: Complete the Additional Details wizard integration.

1. Add "Additional Details" button to the post-rating success screen
2. Wire up each wizard step to use the form components
3. Add API call to save all fields on completion
4. Handle "Skip All" to close without saving
5. Show success message after saving

---

### **Prompt 12: Edit Functionality - Book Details Page**

**Context**: All creation flows complete. Now enable editing.

**Task**: Add edit functionality for all tracking fields on book details page.

1. Add "Edit Tracking Details" section to book details/edit page
2. Display all tracking fields with current values
3. Use the same form components created earlier
4. Add Save/Cancel buttons
5. Update via existing book update API endpoint
6. Show success toast on save

---

### **Prompt 13: Autocomplete Hook**

**Context**: Need to wire up autocomplete functionality.

**Task**: Create a custom hook for autocomplete suggestions.

Create src/hooks/useAutocomplete.ts:

1. Create `useBookClubs` hook:
   - Fetch suggestions from /api/user/book-clubs
   - Debounce input (300ms)
   - Cache results

2. Create `useReadathons` hook:
   - Fetch suggestions from /api/user/readathons
   - Debounce input (300ms)
   - Cache results

3. Update BookClubField and ReadathonField components to use these hooks.

---

### **Prompt 14: Data Display Integration**

**Context**: All input functionality complete. Display the data where appropriate.

**Task**: Update book display components to show tracking data.

1. Update BookCard component to show:
   - Re-read badge if applicable
   - Book club indicator if applicable

2. Update book details page to display all tracking information:
   - Create a "Tracking Details" section
   - Show all populated fields
   - Use appropriate formatting for each field type
   - Hide empty fields

---

### **Prompt 15: Final Integration & Polish**

**Context**: All features implemented. Final integration and polish.

**Task**: Ensure everything is properly connected and polished.

1. Verify all new fields are saved and retrieved correctly
2. Add loading states to all async operations
3. Add error handling with user-friendly messages
4. Ensure mobile responsiveness for all new components
5. Add accessibility labels (aria-label, aria-describedby)
6. Test the complete flow from adding a book to editing tracking details

---

## Technical Approach

### Database Strategy
- All fields nullable for backward compatibility
- Separate tables for autocomplete data
- Indexed for performance

### API Strategy
- Extend existing endpoints where possible
- Validate all input lengths
- Return meaningful error messages

### UI Strategy
- Reusable, controlled components
- Progressive disclosure (show fields when relevant)
- Mobile-first responsive design

### State Management
- Form state managed locally in components
- API data fetched with existing patterns
- Optimistic updates where appropriate

## Risk Mitigation

1. **Database Migration Risk**: Test migrations on dev database first
2. **Backward Compatibility**: All fields nullable, existing books unaffected
3. **Performance**: Limit autocomplete queries, use debouncing
4. **User Experience**: All fields optional, can skip entirely
5. **Data Validation**: Server-side validation for all inputs

## Dependencies

- Existing Prisma setup
- Existing API structure
- Existing form components and patterns
- Existing modal/wizard patterns in codebase

## Testing Strategy

1. Test each phase independently
2. Verify backward compatibility with existing books
3. Test character limits and validation
4. Test autocomplete functionality
5. Test edit capabilities
6. Full end-to-end flow testing