# Specification: Social Sharing of Reviews

## Goal
Enable users to share completed book reviews via unique public URLs, displaying full CAWPILE ratings and book metadata with user-controlled privacy toggles for optional fields.

## User Stories
- As a reader, I want to share my book review via a public link so that friends can see my CAWPILE rating and thoughts without creating an account
- As a user, I want to control which personal details (reading dates, book clubs, readathons) appear on shared reviews so I can maintain privacy while sharing

## Specific Requirements

**Shareable Link Generation**
- Only books with status COMPLETED and existing CAWPILE rating can be shared
- User initiates share action from kebab menu on dashboard book card
- System generates unique, non-guessable identifier using nanoid or uuid
- Share URL format: `/share/reviews/{unique-id}` or shortened `/r/{unique-id}`
- One share per UserBook (unique constraint on userBookId in SharedReview model)
- Share link copied to clipboard automatically after generation

**Database Schema - SharedReview Model**
- id: string (unique share identifier, primary key)
- userId: string (foreign key to User)
- userBookId: string (foreign key to UserBook, unique constraint)
- shareToken: string (unique, url-safe identifier for public access)
- showDates: boolean (default true - controls reading date visibility)
- showBookClubs: boolean (default true - controls book club visibility)
- showReadathons: boolean (default true - controls readathon visibility)
- createdAt: DateTime (timestamp of share creation)
- updatedAt: DateTime (timestamp of last settings update)
- Relationships: belongs to User and UserBook

**API Endpoints**
- POST /api/user/books/[id]/share: Creates share record, validates ownership and eligibility (COMPLETED + rating exists), returns share URL
- GET /api/share/reviews/[shareToken]: Fetches public review data without authentication, returns book metadata, rating, and conditionally included fields based on privacy settings
- DELETE /api/user/books/[id]/share: Removes share record, validates user ownership
- PATCH /api/user/books/[id]/share: Updates privacy toggles (showDates, showBookClubs, showReadathons)

**Public Review Page Content**
- Book cover image (from GoogleBook)
- Book title and authors
- All 7 CAWPILE rating facets with individual scores (Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment)
- Overall computed score, star rating, and letter grade
- Written review text if provided
- Reading dates (start and finish) if showDates is true
- Book club name if showBookClubs is true and bookClubName exists
- Readathon name if showReadathons is true and readathonName exists
- No user identity displayed (anonymous review)

**UI Components Required**
- ShareReviewModal: Dialog with privacy toggles for dates, book clubs, readathons, copy URL button
- ShareButton: New menu item in BookCard kebab menu (only visible for COMPLETED books with ratings)
- Public review page: Server Component at app/share/reviews/[shareToken]/page.tsx using existing CawpileFacetDisplay, StarRating, book display patterns
- Copy-to-clipboard functionality with success feedback

**Privacy Controls**
- Per-review opt-in only (no global sharing settings)
- User must explicitly select "Share Review" from kebab menu
- Privacy toggles default to true (dates, clubs, readathons all shown initially)
- User can update privacy settings via PATCH endpoint after share creation
- Share can be deleted entirely via DELETE endpoint

**Middleware Configuration**
- Public share route /share/reviews/[shareToken] must be excluded from NextAuth authentication requirement
- Update middleware.ts matcher to allow unauthenticated access to share routes
- API endpoint /api/share/reviews/[shareToken] requires no authentication

**Security Considerations**
- ShareToken must be cryptographically secure (nanoid with 21+ characters or uuid v4)
- API endpoints for create/delete/update must validate user ownership via getCurrentUser()
- Public GET endpoint validates shareToken exists but requires no authentication
- Prisma query for public review includes only whitelisted fields to prevent data leakage

## Existing Code to Leverage

**CawpileFacetDisplay Component**
- Located at src/components/rating/CawpileFacetDisplay.tsx
- Displays all 7 rating facets with color-coded scores
- Supports compact and full display modes
- Reuse for public review page rating display
- Handles both fiction and non-fiction facet configurations

**BookCard Kebab Menu Pattern**
- Located at src/components/dashboard/BookCard.tsx (lines 234-344)
- Uses Headless UI Menu component with transition animations
- Implements menu items with hover states and icons
- Add "Share Review" menu item following existing pattern
- Conditional visibility based on book status and rating presence

**Modal Dialog Pattern**
- Located in src/components/modals/ directory
- EditBookModal.tsx demonstrates Headless UI Dialog implementation (lines 138-390)
- Includes backdrop blur, escape key handling, transition animations
- Follow pattern for ShareReviewModal with privacy toggle checkboxes

**API Route Ownership Validation**
- Located at src/app/api/user/books/[id]/route.ts (lines 59-74)
- Uses getCurrentUser() from @/lib/auth-helpers for authentication
- Validates user ownership with prisma.userBook.findFirst where userId matches
- Returns 401 if unauthorized, 404 if book not found
- Apply same pattern to share endpoints

**Prisma Client Singleton**
- Located at src/lib/prisma.ts
- Import via: import prisma from '@/lib/prisma'
- Use for all database operations in API routes
- Handles connection pooling and Neon serverless support

## Out of Scope
- Image card generation for social media previews
- Open Graph meta tags for rich social link previews
- Social comments or interactions on public review page
- Follower systems or user profiles
- Embedding reviews on external websites
- Global privacy settings (all shares are per-review opt-in)
- Edit or delete functionality from public page (must be done in dashboard)
- Share analytics (view counts, visitor tracking)
- Sharing in-progress reads (READING status) or want-to-read books
- Display of user identity (name, email, profile picture) on public page
