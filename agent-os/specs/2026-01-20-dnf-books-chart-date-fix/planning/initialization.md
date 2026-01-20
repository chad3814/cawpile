# Spec Initialization

## Raw Idea

DNF'd books don't have an ending date, so they don't show up in the charts.

## Context

This is a bug fix for the CAWPILE book reading tracker application. The charts (books-per-month, dnf-per-month, pages-per-month, book-format, main-genres, acquisition-method, lgbtq-representation, disability-representation, new-authors, poc-authors) all query using `finishDate` to determine which year/month a book belongs to. However, DNF (Did Not Finish) books may not have a `finishDate` set because users can mark a book as DNF without explicitly setting an end date.

## Technical Findings

### Database Schema (UserBook model)
- `status`: BookStatus enum (WANT_TO_READ, READING, COMPLETED, DNF)
- `startDate`: DateTime? (optional)
- `finishDate`: DateTime? (optional)
- `dnfReason`: String? (optional reason for DNF)

### Current Chart Query Pattern
All 10 chart API routes use this WHERE clause pattern:
```typescript
finishDate: {
  gte: new Date(`${year}-01-01`),
  lt: new Date(`${year + 1}-01-01`)
},
status: {
  in: ['COMPLETED', 'DNF']
}
```

### Problem
- Charts include DNF status in the filter, expecting DNF books to appear
- However, DNF books without a `finishDate` are excluded by the date filter
- The UI (AddBookWizard) only asks for finish date when user selects "Yes, I finished it"
- When user selects "No, I did not finish (DNF)", no finish date is collected
- The EditBookModal doesn't have date fields at all

### Affected Chart Routes
All 10 routes in `/src/app/api/charts/`:
1. books-per-month
2. dnf-per-month
3. pages-per-month
4. book-format
5. main-genres
6. acquisition-method
7. lgbtq-representation
8. disability-representation
9. new-authors
10. poc-authors
