# CAWPILE Rating System - Implementation Checklist

## Phase 1: Database Foundation ✅ [Partially Complete]
- [x] Add CawpileRating model with nullable fields
- [ ] Add BookType enum (FICTION, NONFICTION)
- [ ] Add bookType field to Book model
- [ ] Generate and apply Prisma migration
- [ ] Generate updated Prisma client types

## Phase 2: Core Types and Utilities
- [x] Create basic CAWPILE type definitions
- [ ] Add fiction/non-fiction facet configurations
- [ ] Create calculateCawpileAverage function (exclude nulls)
- [ ] Create convertToStars function (0-5 based on average)
- [ ] Create getStarEmojis function
- [ ] Create getCawpileGrade function (A+ to F)
- [ ] Add RATING_SCALE_GUIDE constant

## Phase 3: Book Type Detection
- [ ] Create NON_FICTION_CATEGORIES array
- [ ] Build detectBookType function
- [ ] Add case-insensitive category matching
- [ ] Default to FICTION when ambiguous

## Phase 4: API Updates
- [x] Update PATCH endpoint for rating updates
- [ ] Handle NULL values for skipped facets
- [ ] Update POST endpoint to detect book type
- [ ] Store bookType when creating books
- [ ] Add rating retrieval endpoint

## Phase 5: Basic UI Components
- [ ] Create StarRating component (emoji stars)
- [ ] Create RatingGuide component (collapsible help)
- [ ] Create CawpileFacetDisplay component
- [ ] Add color coding for score ranges

## Phase 6: Rating Modal Foundation
- [ ] Create CawpileRatingModal container
- [ ] Build RatingCard component
- [ ] Add slider with 1-10 scale
- [ ] Add navigation controls (Previous/Next/Skip)
- [ ] Add progress indicator

## Phase 7: Rating Modal Logic
- [ ] Implement card state management
- [ ] Add fiction/non-fiction facet adaptation
- [ ] Create RatingSummaryCard component
- [ ] Implement auto-save on transition
- [ ] Handle modal close with save

## Phase 8: BookCard Integration
- [ ] Add star rating display to BookCard
- [ ] Show average score
- [ ] Add hover/tap preview
- [ ] Add "Rate" action to menu
- [ ] Handle null ratings gracefully

## Phase 9: Completion Flow Integration
- [ ] Trigger rating modal on book completion
- [ ] Allow skipping rating prompt
- [ ] Handle re-rating (pre-fill values)
- [ ] Don't re-prompt already rated books

## Phase 10: Polish and Testing
- [ ] Test NULL handling throughout
- [ ] Verify auto-save functionality
- [ ] Ensure mobile responsiveness
- [ ] Test edge cases (all skipped, etc.)
- [ ] Optimize animation performance
- [ ] Add loading states
- [ ] Handle API errors gracefully

## Session Notes
- Database schema partially updated (CawpileRating exists)
- Need to add BookType enum and bookType field
- API endpoints partially ready
- UI components need to be built
- Focus on incremental implementation