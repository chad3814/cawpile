# Spec Requirements: Optimize Dashboard Book Share Query

## Initial Description

Bug: the dashboard queries for the user's books, and passes the books to `<DashboardClient>`, and each book eventually goes to a `<BookCard>`. `<BookCard>` has an effect that pings `/api/user/books/${book.id}/share` to see if the user has shared the book. We should just include this in the original query.

## Requirements Discussion

### First Round Questions

**Q1:** I assume we should include the full `sharedReview` relation in the original query (not just a boolean flag), so that if the review is shared, we have all the data (shareToken, showDates, etc.) available immediately. Is that correct, or would a simple "hasShare: boolean" be sufficient?
**Answer:** Include full sharedReview data to completely eliminate N+1 calls.

**Q2:** I'm thinking we should update the type definitions for the book data passed through the component chain (Dashboard -> DashboardClient -> ViewSwitcher -> BookCard) to include the optional `sharedReview` field. Should we create a shared type definition file, or extend existing types inline?
**Answer:** Create a shared type definition file for book data interfaces.

**Q3:** For the BookCard component, I assume we should: (a) remove the useEffect entirely, (b) use the sharedReview prop to determine share status, and (c) initialize share state from the prop if one exists. Is that the correct approach?
**Answer:** Get rid of state entirely and just use the prop value if possible. If not possible, use the prop value as initial state and remove the useEffect.

**Q4:** I notice BookTable also exists as an alternative view. Should we also update it to use the sharedReview data from the query, or is this change only for BookCard?
**Answer:** Yes, update BookTable as well.

**Q5:** The sharedReview includes fields like showDates, showBookClubs, showReadathons, showReview. Including all of this in the initial query will slightly increase payload size. Any concerns about this, or should we proceed knowing the trade-off (larger payload vs fewer requests)?
**Answer:** No concerns about payload size.

**Q6:** Is there anything that should be explicitly excluded from this optimization effort?
**Answer:** Only implement what is explicitly stated - no scope creep.

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

None required - all answers were clear and complete.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- Add `sharedReview` include to the dashboard's Prisma query in `src/app/dashboard/page.tsx`
- Pass `sharedReview` data through the component chain: Dashboard -> DashboardClient -> ViewSwitcher -> BookCard/BookTable
- Remove the `useEffect` fetch in `BookCard` that calls `/api/user/books/${book.id}/share`
- Update `BookCard` to use the `sharedReview` prop directly (eliminate state if possible)
- Update `BookTable` to use the `sharedReview` prop directly
- Create a shared type definition file for book data interfaces that includes the optional `sharedReview` field

### Reusability Opportunities
- The shared type definition file will be reusable across dashboard components

### Scope Boundaries

**In Scope:**
- Modifying the Prisma query in dashboard page to include `sharedReview`
- Creating a shared type definition file for book data interfaces
- Updating `DashboardClient` to pass `sharedReview` data through
- Updating `ViewSwitcher` to pass `sharedReview` data through
- Updating `BookCard` to use prop instead of fetching (remove useEffect, eliminate state if possible)
- Updating `BookTable` to use prop instead of fetching

**Out of Scope:**
- Any other performance optimizations
- Changes to the `/api/user/books/[id]/share` endpoint
- Changes to the SharedReview model
- Any UI/UX changes
- Any other dashboard features

### Technical Considerations
- The `sharedReview` relation is one-to-one with `UserBook` (optional)
- Full `sharedReview` data includes: id, userId, userBookId, shareToken, showDates, showBookClubs, showReadathons, showReview
- Payload size increase is acceptable for the performance benefit of eliminating N+1 API calls
- State elimination is preferred over state initialization from props
