# CAWPILE Rating System - Implementation Plan

## Overview
This plan breaks down the CAWPILE rating system implementation into small, incremental steps that build on each other. Each step is designed to be safely implemented while maintaining a working application.

## Phase 1: Database Foundation (Backend Infrastructure)

### Step 1.1: Update Database Schema
Add BookType enum and update Book model with bookType field. Add the field to CawpileRating model to allow NULLs for skipped facets.

### Step 1.2: Create Migration
Generate and apply Prisma migration for the schema changes.

### Step 1.3: Update Prisma Types
Generate new Prisma client types to reflect schema changes.

## Phase 2: Core Types and Utilities

### Step 2.1: Create CAWPILE Type Definitions
Define TypeScript interfaces for CAWPILE ratings, including fiction/non-fiction facet configurations.

### Step 2.2: Create Book Type Detection Utility
Build utility function to detect fiction/non-fiction from Google Books categories.

### Step 2.3: Create Rating Calculation Utilities
Build functions for:
- Calculating average from non-null facets
- Converting average to star count
- Converting average to letter grade

## Phase 3: API Layer

### Step 3.1: Update Book Creation API
Modify `/api/user/books/route.ts` POST endpoint to detect and store book type when adding books.

### Step 3.2: Enhance Rating Update API
Update `/api/user/books/[id]/route.ts` PATCH endpoint to handle NULL values for skipped facets.

### Step 3.3: Create Rating Retrieval API
Add GET endpoint to fetch CAWPILE ratings with proper NULL handling.

## Phase 4: Basic UI Components

### Step 4.1: Create Star Rating Display Component
Build component to show 0-5 emoji stars based on CAWPILE average.

### Step 4.2: Create Rating Scale Guide Component
Build collapsible help component showing 1-10 scale definitions.

### Step 4.3: Create CAWPILE Facet Display Component
Build component to show individual facet scores with "--" for skipped.

## Phase 5: Rating Modal - Foundation

### Step 5.1: Create Modal Container
Build base modal component with sliding animation support.

### Step 5.2: Create Rating Card Component
Build individual rating card with slider, facet info, and help toggle.

### Step 5.3: Create Navigation Controls
Add Previous/Next/Skip buttons with progress indicator.

## Phase 6: Rating Modal - Logic

### Step 6.1: Implement Card State Management
Handle rating values, navigation, and auto-save on transition.

### Step 6.2: Add Fiction/Non-fiction Adaptation
Dynamically change facet labels based on book type.

### Step 6.3: Create Summary Card
Build final summary card showing all ratings and average.

## Phase 7: Integration - Book Cards

### Step 7.1: Update BookCard Component
Add star rating and average display to existing BookCard.

### Step 7.2: Add Hover Preview
Implement hover/tap preview showing CAWPILE breakdown.

### Step 7.3: Add Rating Action
Add "Rate" button to book action menu.

## Phase 8: Integration - Book Completion Flow

### Step 8.1: Update Status Change Handler
Modify book status update to trigger rating modal on completion.

### Step 8.2: Add Skip Option
Allow users to dismiss rating prompt and rate later.

### Step 8.3: Handle Re-rating
Implement pre-filling of existing ratings when editing.

## Phase 9: Testing and Polish

### Step 9.1: Test Edge Cases
Verify NULL handling, zero ratings, modal closure behavior.

### Step 9.2: Responsive Design
Ensure modal and components work on mobile devices.

### Step 9.3: Performance Optimization
Optimize auto-save requests and animation performance.

---

# Implementation Prompts

## Prompt 1: Database Schema Updates

**Context**: We need to add BookType enum and update our Prisma schema to support the CAWPILE rating system with nullable facets.

**Task**: Update the Prisma schema with:
1. Add BookType enum (FICTION, NONFICTION)
2. Add bookType field to Book model with FICTION default
3. Update CawpileRating model to make all facet fields nullable (Int?)
4. Ensure average field remains required (Float)

Update the file `prisma/schema.prisma` with these changes.

---

## Prompt 2: CAWPILE Type Definitions

**Context**: We need TypeScript types to support both fiction and non-fiction CAWPILE ratings with different facet labels.

**Task**: Create a new file `src/types/cawpile.ts` with:
1. CawpileRating interface with nullable number fields
2. CAWPILE_FACETS arrays for fiction and non-fiction with proper labels
3. BookType enum matching Prisma schema
4. Helper type for facet configuration including name, key, description, and questions

Include the full facet definitions from the spec for both fiction and non-fiction books.

---

## Prompt 3: Rating Calculation Utilities

**Context**: We need utility functions to calculate CAWPILE averages and convert to display formats.

**Task**: Add to `src/types/cawpile.ts`:
1. `calculateCawpileAverage(rating)` - calculates average excluding null values
2. `convertToStars(average)` - returns 0-5 based on thresholds
3. `getStarEmojis(stars)` - returns string of ⭐️ emojis
4. `getCawpileGrade(average)` - returns letter grade (A+ to F)
5. `RATING_SCALE_GUIDE` - array of rating descriptions (1-10)

Handle edge case where all facets are null (return 0).

---

## Prompt 4: Book Type Detection

**Context**: We need to auto-detect if a book is fiction or non-fiction based on Google Books categories.

**Task**: Create `src/lib/bookTypeDetection.ts` with:
1. NON_FICTION_CATEGORIES array with all categories from spec
2. `detectBookType(categories: string[])` function that returns 'FICTION' or 'NONFICTION'
3. Case-insensitive partial matching for category detection
4. Default to 'FICTION' when no categories match

---

## Prompt 5: Update Book Creation API

**Context**: We need to detect and store book type when users add books to their library.

**Task**: Update `/api/user/books/route.ts` POST endpoint:
1. Import book type detection utility
2. Get categories from Google Books data
3. Detect book type using utility function
4. Store bookType when creating/finding Book record
5. Ensure backward compatibility for existing books

---

## Prompt 6: Star Rating Display Component

**Context**: We need a component to display 0-5 star ratings using emoji stars.

**Task**: Create `src/components/rating/StarRating.tsx`:
1. Props: rating (number | null), showAverage (boolean), size ('sm' | 'md' | 'lg')
2. Display 0-5 ⭐️ emojis based on rating
3. Optionally show average next to stars (e.g., "⭐️⭐️⭐️ 6.7")
4. Handle null ratings gracefully (show "--" or nothing)
5. Add proper TypeScript types

---

## Prompt 7: Rating Scale Guide Component

**Context**: We need a collapsible help component showing the 1-10 rating scale.

**Task**: Create `src/components/rating/RatingGuide.tsx`:
1. Collapsible panel (closed by default)
2. Shows all 10 rating levels with descriptions
3. Styled as a small help icon that expands on click
4. Use Headless UI or native details/summary elements
5. Compact design that doesn't overwhelm the interface

---

## Prompt 8: CAWPILE Facet Display Component

**Context**: We need a component to display individual CAWPILE facet scores.

**Task**: Create `src/components/rating/CawpileFacetDisplay.tsx`:
1. Props: rating object, bookType, compact (boolean)
2. Display each facet with its score or "--" for null
3. Adapt facet labels based on fiction/non-fiction
4. Compact mode for previews, full mode for details
5. Color code scores (green 8-10, yellow 6-7, orange 4-5, red 1-3)

---

## Prompt 9: Rating Card Component

**Context**: We need individual cards for rating each CAWPILE facet.

**Task**: Create `src/components/rating/RatingCard.tsx`:
1. Props: facet config, value (number | null), onChange, bookType
2. Display facet name (adapted for book type)
3. Slider input 1-10 with tick marks
4. Show current value prominently
5. List facet questions as guidance
6. Include RatingGuide component
7. Skip button to pass null value

---

## Prompt 10: Modal Container with Sliding

**Context**: We need a modal that supports sliding card transitions.

**Task**: Create `src/components/modals/CawpileRatingModal.tsx`:
1. Props: isOpen, onClose, bookId, bookType, initialRating
2. Use Headless UI Dialog or similar
3. Container for sliding cards with overflow hidden
4. Transform translateX for card sliding animation
5. Progress dots indicator at top
6. Handle escape key and backdrop click

---

## Prompt 11: Navigation and State Management

**Context**: We need to manage navigation between rating cards and handle auto-save.

**Task**: Enhance `CawpileRatingModal.tsx`:
1. State: currentIndex, ratings object, isDirty flag
2. Previous/Next/Skip button handlers
3. Auto-save on card transition using API
4. Debounce saves to avoid excessive requests
5. Handle modal close with unsaved changes
6. Progress indicator updates with current card

---

## Prompt 12: Summary Card Component

**Context**: We need a final summary card showing all ratings.

**Task**: Create `src/components/rating/RatingSummaryCard.tsx`:
1. Display all 7 facets with scores or "--"
2. Calculate and show average (excluding nulls)
3. Show star rating based on average
4. Display letter grade
5. "Done" button to close modal
6. Clean, organized layout

---

## Prompt 13: Fiction/Non-fiction Adaptation

**Context**: We need to dynamically change facet labels based on book type.

**Task**: Update rating components:
1. Create getFacetConfig(bookType) function
2. Return appropriate facet labels and questions
3. Update RatingCard to use dynamic config
4. Update RatingSummaryCard to show correct labels
5. Ensure smooth experience regardless of book type

---

## Prompt 14: Update BookCard Display

**Context**: We need to add CAWPILE ratings to the existing BookCard component.

**Task**: Update `src/components/dashboard/BookCard.tsx`:
1. Fetch and display star rating if available
2. Show average score next to stars
3. Add hover state for rating preview
4. Add "Rate" button to action menu
5. Handle null ratings appropriately
6. Maintain existing card layout and functionality

---

## Prompt 15: Hover Preview Component

**Context**: We need a tooltip/popover showing CAWPILE breakdown on hover.

**Task**: Create hover preview for BookCard:
1. Use Headless UI Popover or CSS hover
2. Show compact CawpileFacetDisplay on hover/tap
3. Position intelligently to avoid viewport edges
4. Mobile: show on tap with close button
5. Desktop: show on hover with delay
6. Smooth fade in/out animation

---

## Prompt 16: Book Completion Integration

**Context**: We need to trigger the rating modal when users mark books as completed.

**Task**: Update completion flow:
1. Modify status update handler in relevant components
2. Open CawpileRatingModal on status → COMPLETED
3. Pass bookId and bookType to modal
4. Allow dismissing without rating
5. Don't re-prompt if already rated
6. Handle the completion → rating flow smoothly

---

## Prompt 17: Re-rating Implementation

**Context**: We need to support editing existing CAWPILE ratings.

**Task**: Implement re-rating:
1. Fetch existing rating when opening modal
2. Pre-fill values in rating cards
3. Re-prompt for previously skipped facets
4. Allow skipping again if desired
5. Update API to handle partial updates
6. Show "Edit Rating" instead of "Rate" for books with ratings

---

## Prompt 18: Auto-save Implementation

**Context**: We need to save ratings progressively as users navigate cards.

**Task**: Implement auto-save:
1. Save on card transition (next/previous)
2. Save current card on modal close
3. Use optimistic updates for smooth UX
4. Handle save failures gracefully
5. Debounce rapid navigation
6. Show subtle save indicator

---

## Prompt 19: Mobile Responsiveness

**Context**: We need the rating system to work well on mobile devices.

**Task**: Optimize for mobile:
1. Ensure modal is full-screen on mobile
2. Make sliders touch-friendly
3. Adjust card layout for small screens
4. Ensure text is readable
5. Test swipe gestures for card navigation
6. Optimize button placement for thumb reach

---

## Prompt 20: Final Integration and Testing

**Context**: We need to ensure all components work together seamlessly.

**Task**: Final integration:
1. Wire up all components in the application
2. Test the complete flow from adding book to rating
3. Verify NULL handling throughout
4. Test re-rating flow
5. Ensure auto-save works correctly
6. Verify star ratings display correctly everywhere
7. Test on various screen sizes
8. Handle edge cases (no rating, all skipped, etc.)