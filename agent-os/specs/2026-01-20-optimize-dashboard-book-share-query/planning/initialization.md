# Spec Initialization

## Raw Idea

bug: the dashboard queries for the user's books, and passes the books to <DashboardClient>, and each book eventually goes to a <BookCard>. <BookCard> has an effect that pings /api/user/books/${book.id}/share to see if the user has shared the book. We should just include this in the original query

## Context from Research

### Current Data Flow

1. **Dashboard page** (`src/app/dashboard/page.tsx`):
   - Queries `prisma.userBook.findMany()` with includes for `edition`, `book`, `googleBook`, and `cawpileRating`
   - Does NOT include `sharedReview` relation
   - Passes `userBooks` array to `<DashboardClient>`

2. **DashboardClient** (`src/components/dashboard/DashboardClient.tsx`):
   - Receives `books` prop
   - Passes books to `<ViewSwitcher>`

3. **ViewSwitcher** (`src/components/dashboard/ViewSwitcher.tsx`):
   - Passes books to either `<BookGrid>` or `<BookTable>`

4. **BookCard** (`src/components/dashboard/BookCard.tsx`):
   - Has a `useEffect` (lines 139-157) that fetches share status:
     ```typescript
     useEffect(() => {
       if (canShare) {
         fetch(`/api/user/books/${book.id}/share`)
           .then(...)
       }
     }, [book.id, canShare])
     ```
   - This fires for EVERY completed book with a rating
   - Results in N API calls for N eligible books

### SharedReview Model

From `prisma/schema.prisma`:
- `SharedReview` has a one-to-one relation with `UserBook` via `userBookId`
- Fields: `id`, `userId`, `userBookId`, `shareToken`, `showDates`, `showBookClubs`, `showReadathons`, `showReview`

### Impact Analysis

- **Performance**: Each `BookCard` for a completed+rated book makes a separate HTTP request
- **API Load**: `/api/user/books/[id]/share/route.ts` GET handler queries `prisma.sharedReview.findUnique()` per book
- **User Experience**: Share status may appear with delay as requests complete asynchronously

### Proposed Solution

Include `sharedReview` in the original dashboard query:
```typescript
const userBooks = await prisma.userBook.findMany({
  where: { userId: user.id },
  include: {
    edition: { include: { book: true, googleBook: true } },
    cawpileRating: true,
    sharedReview: true  // ADD THIS
  },
  orderBy: buildOrderBy(sortBy, sortOrder)
})
```

Then pass the data through the component chain and remove the `useEffect` fetch in `BookCard`.
