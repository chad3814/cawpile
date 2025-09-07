# CAWPILE Rating System - Complete Specification
**Date**: 2025-09-03 23:15  
**Branch**: dev-phase2

## Overview

The CAWPILE rating system is a comprehensive book rating methodology that evaluates books across 7 facets, each rated 1-10. The system adapts its criteria based on whether a book is fiction or non-fiction, providing readers with detailed insights into their reading preferences.

## Core Components

### 1. CAWPILE Facets

#### Fiction Books
- **Characters**: Memorability, depth, relatability, secondary character development
- **Atmosphere**: Immersion, setting visualization, scene energy
- **Writing**: Style, prose quality, flow, dialogue-to-narration ratio
- **Plot**: Pacing, satisfaction, uniqueness, reveals
- **Intrigue**: Engagement, page-turning quality, attention consistency
- **Logic**: Internal consistency, world-building, character motivations
- **Enjoyment**: Overall satisfaction

#### Non-Fiction Books
- **Credibility/Research**: Trustworthiness, unbiased reporting, references, demographic inclusivity
- **Authenticity/Uniqueness**: New perspectives, differentiation from other books
- **Writing**: Accessibility, presentation style, readability
- **Personal Impact**: Takeaways, usefulness, lasting impact
- **Intrigue**: Engagement, attention-holding throughout
- **Logic/Informativeness**: Clarity, knowledge density vs filler
- **Enjoyment**: Overall satisfaction

### 2. Rating Scale Guide
- **10/10**: One of my favourites ever
- **9/10**: Excellent. Maybe one little problem
- **8/10**: Great. A couple of problems, but nothing major
- **7/10**: Good. Has issues, but enjoyable
- **6/10**: Ok. Good outweighs bad
- **5/10**: Mediocre. Equal good and bad
- **4/10**: Poor. Bad outweighs good
- **3/10**: Bad. A few good things but not enjoyable
- **2/10**: Horrible. Not enough to redeem
- **1/10**: Abysmal. Shouldn't have been published

### 3. Star Display System
Based on CAWPILE average (displayed as emoji stars):
- **0-1.0** → 0 stars
- **1.1-2.2** → ⭐️
- **2.3-4.5** → ⭐️⭐️
- **4.6-6.9** → ⭐️⭐️⭐️
- **7.0-8.9** → ⭐️⭐️⭐️⭐️
- **9.0-10** → ⭐️⭐️⭐️⭐️⭐️

## Implementation Details

### Book Type Detection
- **Auto-detection**: Based on Google Books categories
- **Default**: Fiction (when category is ambiguous)
- **Storage**: `bookType` field in Book model
- **Admin Override**: Future admin tools can globally change book type

#### Non-Fiction Genre List
Books in these categories auto-classify as non-fiction:
- Biography & Autobiography
- Business & Economics
- Computers & Technology
- Cooking & Food
- Health & Fitness
- History
- Law
- Medical
- Philosophy
- Psychology
- Religion & Spirituality
- Science & Mathematics
- Self-Help
- Social Science
- Sports & Recreation
- Travel
- True Crime
- Reference & Study Aids
- Politics & Government
- Essays & Literary Criticism

### Rating User Interface

#### Modal Structure
- **Type**: Sliding card interface in a modal
- **Navigation**: Free navigation (Previous/Next/Skip buttons)
- **Progress Indicator**: Shows current facet position
- **Auto-save**: Each card saves automatically on transition

#### Card Components
Each rating card displays:
- Facet name (adapted for fiction/non-fiction)
- Rating slider (1-10)
- Description questions for context
- Collapsible help icon with full rating scale guide

#### Summary Card
Final card shows:
- List of all facets with ratings (or "--" for skipped)
- Calculated average (e.g., "7.3")
- Star rating display
- "Done" button to complete

### Rating Behavior

#### Initial Rating
- **Trigger**: Optional prompt when marking book as "Completed"
- **Access**: Always available through book action menu
- **Skipping**: Users can skip any facet
- **Calculation**: Average excludes skipped facets (NULL values)

#### Editing Ratings
- **Availability**: Anytime after book is added
- **Pre-fill**: Previous ratings displayed
- **Skipped Facets**: Re-prompted but still skippable
- **Auto-save**: Progressive saving on each card

### Database Design

#### Schema Updates
```prisma
model Book {
  bookType    BookType   @default(FICTION)
  // ... other fields
}

model CawpileRating {
  characters  Int?  // NULL for skipped
  atmosphere  Int?  
  writing     Int?
  plot        Int?
  intrigue    Int?
  logic       Int?
  enjoyment   Int?
  average     Float // Calculated from non-null values
}

enum BookType {
  FICTION
  NONFICTION
}
```

### Display Throughout App

#### Book Cards
- Star rating (⭐️ symbols, no partial stars)
- Average score (e.g., "7.3")
- Hover/tap preview showing all facet scores

#### Detail Views
- Full CAWPILE breakdown
- Skipped facets shown as "--"
- Edit rating button

## Edge Cases & Error Handling

1. **Re-rating**: Opens modal with previous values pre-filled
2. **Modal Closure**: Current card auto-saves before closing
3. **Zero Ratings**: If all facets skipped, no rating is saved
4. **Validation**: No minimum facets required
5. **Progress Tracking**: Each card transition triggers save

## Future Enhancements (Out of Scope)

- Community ratings aggregation
- External site ratings (Goodreads, Amazon, etc.)
- Rating statistics dashboard
- Rating history/versioning
- Book type user override

## Success Criteria

1. ✅ Users can rate books using CAWPILE system
2. ✅ Fiction/non-fiction auto-detection works
3. ✅ Ratings display as stars + average throughout app
4. ✅ Rating modal provides smooth sliding card UX
5. ✅ Partial ratings (skipped facets) handled gracefully
6. ✅ Re-rating preserves previous values
7. ✅ Auto-save prevents data loss