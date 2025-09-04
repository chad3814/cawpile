# Book Tracker - Phase 1 Implementation Plan

## Overview
This plan provides a step-by-step blueprint for implementing Phase 1 of the Book Tracker application. Each step builds incrementally on the previous, ensuring no orphaned code and continuous integration.

## Implementation Strategy
1. Start with database and environment setup
2. Add authentication layer
3. Build core UI structure
4. Implement book search functionality
5. Add book management features
6. Create dashboard views
7. Wire everything together

---

## Step-by-Step Implementation Prompts

### Step 1: Environment and Database Setup

**Prompt:**
```
Set up a Next.js 15 project with Neon PostgreSQL and Prisma ORM.

1. Install required dependencies:
   - @prisma/client prisma
   - @neondatabase/serverless
   - dotenv

2. Create a .env.local file with:
   - DATABASE_URL for Neon connection
   - DIRECT_URL for Neon direct connection

3. Initialize Prisma with PostgreSQL provider

4. Create the initial Prisma schema with these models:
   - User model (id, email, name, image, createdAt, updatedAt)
   - Account model for OAuth (standard NextAuth fields)
   - Session model for NextAuth

5. Set up Prisma client singleton for Next.js

Test: npx prisma db push should successfully create tables in Neon
```

---

### Step 2: Implement NextAuth with Google OAuth

**Prompt:**
```
Add NextAuth.js v5 with Google OAuth provider to the project.

1. Install dependencies:
   - next-auth@beta
   - @auth/prisma-adapter

2. Set up environment variables:
   - NEXTAUTH_URL
   - NEXTAUTH_SECRET
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET

3. Create auth configuration at src/lib/auth.ts:
   - Configure Google OAuth provider
   - Use Prisma adapter
   - Set session strategy to "jwt"
   - Configure 6-month session maxAge

4. Create API route at app/api/auth/[...nextauth]/route.ts

5. Create auth utilities:
   - getServerSession helper
   - useSession client hook wrapper

Test: Should be able to sign in with Google and session persists
```

---

### Step 3: Create Base Layout and Navigation

**Prompt:**
```
Build the application shell with navigation header and protected routes.

1. Create a RootLayout component with:
   - SessionProvider wrapper
   - Global styles with TailwindCSS

2. Create Header component at src/components/layout/Header.tsx:
   - Logo on left (links to / or /dashboard based on auth)
   - "Track Book" button (center-right, only when authenticated)
   - User menu dropdown (far right when authenticated)
   - Sign in button (far right when not authenticated)

3. Create UserMenu component with:
   - User avatar and name
   - Dropdown with: Profile, Settings, Sign Out options
   - Use next-auth signOut function

4. Add middleware.ts for protected routes:
   - Protect /dashboard route
   - Redirect authenticated users from / to /dashboard

Test: Navigation should show different states for authenticated/unauthenticated users
```

---

### Step 4: Build Landing and Auth Pages

**Prompt:**
```
Create the landing page and authentication flow pages.

1. Create landing page at app/page.tsx:
   - Hero section with app name and tagline
   - Three feature cards (Track Reading, Set Goals, Discover Books)
   - Call-to-action button "Start Tracking" → sign in
   - Clean, centered layout with TailwindCSS

2. Create sign-in page at app/auth/signin/page.tsx:
   - Centered card with app logo
   - "Sign in with Google" button
   - Uses signIn from next-auth/react
   - Redirect to /dashboard after success

3. Add loading states:
   - Show spinner while authentication is processing
   - Handle errors with generic message

Test: Should flow from landing → sign in → dashboard
```

---

### Step 5: Extend Database Schema for Books

**Prompt:**
```
Expand Prisma schema with book-related models.

1. Add to schema.prisma:
   - Book model (id, title, authors[], language, createdAt)
   - Edition model (id, bookId, isbn10, isbn13, title, authors[], format, googleBooksId)
   - GoogleBook model (id, googleId, title, subtitle, authors[], description, publishedDate, pageCount, imageUrl, categories[])
   - UserBook model (id, userId, editionId, status, format, startDate, finishDate, progress, createdAt, updatedAt)

2. Add enums:
   - BookStatus (WANT_TO_READ, READING, COMPLETED)
   - BookFormat (HARDCOVER, PAPERBACK, EBOOK, AUDIOBOOK)

3. Add relationships and indexes:
   - Edition belongs to Book
   - UserBook belongs to User and Edition
   - Unique constraint on UserBook (userId, editionId)
   - Indexes on frequently queried fields

4. Run migration to update database

Test: prisma studio should show all new tables with correct relationships
```

---

### Step 6: Create Google Books API Integration

**Prompt:**
```
Build service layer for Google Books API integration.

1. Create src/lib/googleBooks.ts service:
   - searchBooks(query: string, maxResults: number = 10)
   - getBookById(googleBookId: string)
   - Parse API response to normalized format
   - Handle API errors gracefully

2. Add types at src/types/book.ts:
   - GoogleBookResult interface
   - BookSearchResult interface
   - Include all needed fields from API

3. Create API route at app/api/books/search/route.ts:
   - GET endpoint accepting query parameter
   - Call googleBooks service
   - Return normalized results
   - Add authentication check

4. Add environment variable:
   - GOOGLE_BOOKS_API_KEY

Test: API route /api/books/search?q=harry should return book results
```

---

### Step 7: Build Book Search Modal Component

**Prompt:**
```
Create the book search modal triggered by "Track Book" button.

1. Install dependencies:
   - @headlessui/react for modal
   - @heroicons/react for icons

2. Create BookSearchModal at src/components/modals/BookSearchModal.tsx:
   - Modal with search input at top
   - Display search results as cards
   - Each result shows: cover, title, authors, year, truncated description
   - Loading state while searching
   - Empty state for no results
   - Click on book to select it

3. Create useBookSearch hook:
   - Debounced search with 300ms delay
   - Fetch from /api/books/search
   - Handle loading and error states

4. Add modal to Header component:
   - State for modal open/closed
   - "Track Book" button opens modal
   - Pass selected book to next step

Test: Clicking "Track Book" should open modal with working search
```

---

### Step 8: Create Book Addition Wizard

**Prompt:**
```
Build multi-step wizard for adding books to library.

1. Create AddBookWizard at src/components/modals/AddBookWizard.tsx:
   - Receives selected book from search modal
   - Step tracking with useState
   - Progress indicator at top

2. Implement Step 1 - Status & Format:
   - Radio buttons for status (Want to Read, Reading, Completed)
   - Radio buttons for format (Hardcover, Paperback, Ebook, Audiobook)
   - Next button to proceed

3. Implement Step 2 - Start Date (if Reading/Completed):
   - Date input with today as default
   - Skip this step for Want to Read
   - Next/Back buttons

4. Implement Step 3 - Progress (if Reading):
   - Toggle between input types: Pages, Time, Percentage
   - Input field with appropriate validation
   - Conversion logic to percentage
   - Next/Back buttons

5. Implement Step 4 - Completion (if Completed):
   - "Did you finish?" Yes/No toggle
   - Finish date picker
   - Submit/Back buttons

6. Create submission handler:
   - Prepare data for API
   - Show loading during submission

Test: Should flow through appropriate steps based on book status
```

---

### Step 9: Create Book Management API Routes

**Prompt:**
```
Build API endpoints for managing user's books.

1. Create app/api/user/books/route.ts:
   - GET: Fetch user's books with filters
   - POST: Add new book to library

2. Implement POST /api/user/books:
   - Validate request body
   - Check if book exists in DB, create if not
   - Check if edition exists, create if not
   - Create UserBook entry
   - Handle duplicates gracefully
   - Return created book data

3. Implement GET /api/user/books:
   - Accept query params: status, limit, offset
   - Join with Edition and Book tables
   - Sort by status (reading first) then updatedAt
   - Return paginated results

4. Create database utilities at src/lib/db/books.ts:
   - findOrCreateBook(title, authors, language)
   - findOrCreateEdition(bookId, googleData)
   - Implement deduplication logic

5. Add error handling:
   - Proper status codes
   - Consistent error format

Test: POST should add book, GET should retrieve user's books
```

---

### Step 10: Build Dashboard Page

**Prompt:**
```
Create the main dashboard view for authenticated users.

1. Create app/dashboard/page.tsx:
   - Server component with auth check
   - Fetch user's books on server
   - Pass data to client components

2. Create BookGrid component at src/components/dashboard/BookGrid.tsx:
   - Grid layout responsive to screen size
   - Currently Reading section at top
   - Other books below
   - Handle empty state

3. Create BookCard component at src/components/dashboard/BookCard.tsx:
   - Display cover image (with fallback)
   - Title and authors
   - Reading progress bar (if status=READING)
   - Status badge
   - Format indicator icon

4. Create EmptyLibrary component:
   - Friendly message for new users
   - Large "Add Your First Book" button
   - Opens search modal when clicked

5. Add loading skeleton:
   - Show while data is loading
   - Match layout of actual content

Test: Dashboard should show books in correct order with progress
```

---

### Step 11: Wire Book Addition Flow End-to-End

**Prompt:**
```
Connect all components for complete book addition flow.

1. Update Header component:
   - Manage both search and wizard modal states
   - Pass selected book from search to wizard
   - Close search modal when opening wizard

2. Update AddBookWizard:
   - Call POST /api/user/books on submission
   - Show success state briefly
   - Close modal and refresh dashboard
   - Handle errors with user feedback

3. Add optimistic updates:
   - Create useUserBooks hook with SWR or React Query
   - Optimistically add book to list
   - Revalidate after API success

4. Update BookSearchModal:
   - Disable already-added books
   - Show "Already in library" badge
   - Pass selection to parent component

5. Add dashboard refresh:
   - Revalidate data after adding book
   - Smooth transition for new book appearing

Test: Complete flow from search → add → see on dashboard
```

---

### Step 12: Add Progress Update Feature

**Prompt:**
```
Enable users to update reading progress from dashboard.

1. Create UpdateProgressModal at src/components/modals/UpdateProgressModal.tsx:
   - Input for current page/time/percentage
   - Show current progress
   - Calculate and display percentage
   - Submit button to save

2. Add to BookCard component:
   - "Update Progress" button for READING books
   - Opens UpdateProgressModal
   - Pass current book data

3. Create PATCH endpoint at app/api/user/books/[id]/route.ts:
   - Update progress field
   - Validate percentage is 0-100
   - Return updated book

4. Add progress calculation utilities:
   - pagestoPercentage(current, total)
   - timeToPercentage(minutes, estimatedTotal)
   - Handle edge cases

5. Update dashboard after progress change:
   - Optimistic update
   - Smooth progress bar animation

Test: Should update progress and see change immediately
```

---

### Step 13: Implement Basic Error Handling

**Prompt:**
```
Add error boundaries and user feedback throughout the app.

1. Create ErrorBoundary component at src/components/ErrorBoundary.tsx:
   - Catch JavaScript errors
   - Display fallback UI
   - Log errors to console
   - Reset button to try again

2. Wrap main areas with ErrorBoundary:
   - Dashboard page
   - Modal components
   - API route handlers

3. Add error states to components:
   - BookSearchModal - search errors
   - AddBookWizard - submission errors
   - Dashboard - loading errors
   - Show user-friendly messages

4. Create error logging utility:
   - Log to console in development
   - Prepare for future error service
   - Include useful context

5. Add API error handling:
   - Consistent error response format
   - Proper HTTP status codes
   - Helpful error messages

Test: Errors should be caught and displayed gracefully
```

---

### Step 14: Add Polish and Final Integration

**Prompt:**
```
Final polish pass to ensure everything is integrated and working smoothly.

1. Add loading states throughout:
   - Button loading spinners
   - Skeleton screens
   - Smooth transitions

2. Improve mobile responsiveness:
   - Test all modals on mobile
   - Ensure touch-friendly buttons
   - Responsive grid layouts
   - Mobile-optimized navigation

3. Add keyboard navigation:
   - Escape to close modals
   - Tab through form fields
   - Enter to submit forms

4. Performance optimizations:
   - Image lazy loading
   - Optimize database queries
   - Add proper indexes
   - Cache Google Books data

5. Final testing checklist:
   - Sign in/out flow
   - Add different book types
   - Update progress
   - Empty states
   - Error states
   - Mobile experience

6. Code cleanup:
   - Remove console.logs
   - Add TypeScript types everywhere
   - Consistent naming
   - Extract magic numbers to constants

Test: Full user journey should work smoothly on desktop and mobile
```

---

## Development Order Summary

1. **Foundation** (Steps 1-2): Database, Auth
2. **Structure** (Steps 3-4): Layout, Landing
3. **Data Layer** (Steps 5-6): Schema, API Integration
4. **Core Features** (Steps 7-9): Search, Add Books
5. **User Interface** (Steps 10-11): Dashboard, Integration
6. **Enhancements** (Steps 12-14): Progress, Errors, Polish

## Success Metrics
- User can sign in with Google
- User can search for books
- User can add books with different statuses
- User can see their books on dashboard
- User can update reading progress
- All flows work on mobile
- Errors are handled gracefully