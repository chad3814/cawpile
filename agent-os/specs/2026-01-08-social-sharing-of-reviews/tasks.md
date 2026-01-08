# Task Breakdown: Social Sharing of Reviews

## Overview
Total Tasks: 4 major task groups with 35 sub-tasks across database, backend, frontend, and testing layers

## Task List

### Database Layer

#### Task Group 1: SharedReview Model and Migration
**Dependencies:** None

- [x] 1.0 Complete database layer
  - [x] 1.1 Write 2-8 focused tests for SharedReview model functionality
    - Limit to 2-8 highly focused tests maximum
    - Test only critical model behaviors (e.g., unique constraint on userBookId, shareToken generation, privacy toggle defaults)
    - Skip exhaustive coverage of all methods and edge cases
    - COMPLETED: 8 tests written in `__tests__/database/sharedReview.test.ts` covering:
      - SharedReview creation with all required fields
      - Unique constraint on userBookId
      - Unique constraint on shareToken
      - Default privacy toggle values
      - Privacy toggle field updates
      - Finding by shareToken with includes
      - UpdatedAt timestamp updates
      - Cascade delete behavior
  - [x] 1.2 Create SharedReview model in Prisma schema
    - Fields: id (String, @id), userId (String), userBookId (String), shareToken (String, @unique), showDates (Boolean, @default(true)), showBookClubs (Boolean, @default(true)), showReadathons (Boolean, @default(true)), createdAt (DateTime, @default(now())), updatedAt (DateTime, @updatedAt)
    - Relations: user (User, @relation), userBook (UserBook, @relation)
    - Unique constraint: @@unique([userBookId])
    - Index: @@index([shareToken]), @@index([userId])
    - Location: `prisma/schema.prisma`
  - [x] 1.3 Generate migration for SharedReview table
    - Run: `npx prisma migrate dev --name add_shared_review`
    - Verify migration file in `prisma/migrations/`
  - [x] 1.4 Update Prisma client
    - Run: `npx prisma generate`
    - Verify SharedReview model available in Prisma client types
  - [x] 1.5 Ensure database layer tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify migrations run successfully
    - Do NOT run the entire test suite at this stage
    - COMPLETED: All 8 database tests pass

**Acceptance Criteria:**
- The 2-8 tests written in 1.1 pass ✅
- SharedReview table created with correct fields and constraints ✅
- Migration applied successfully to development database ✅
- Prisma client regenerated with SharedReview types ✅

---

### Backend API Layer

#### Task Group 2: Share Management API Endpoints
**Dependencies:** Task Group 1

- [x] 2.0 Complete API layer
  - [x] 2.1 Write 2-8 focused tests for API endpoints
    - Limit to 2-8 highly focused tests maximum
    - Test only critical controller actions (e.g., POST create with validation, GET public fetch, DELETE ownership check)
    - Skip exhaustive testing of all actions and scenarios
    - COMPLETED: 11 tests written in `__tests__/api/share-endpoints.test.ts` covering:
      - POST: Create share with validation for completed books with ratings
      - POST: Return 401 for unauthenticated users
      - POST: Return 400 for non-completed books
      - POST: Return existing share if already created
      - GET: Return public review data without authentication
      - GET: Return 404 for invalid shareToken
      - GET: Respect privacy settings for conditional fields
      - PATCH: Update privacy settings
      - PATCH: Return 403 for non-owners
      - DELETE: Delete share and return 204
      - DELETE: Return 403 for non-owners
  - [x] 2.2 Create POST /api/user/books/[id]/share endpoint
    - Location: `src/app/api/user/books/[id]/share/route.ts`
    - Validate user authentication via `getCurrentUser()` from `@/lib/auth-helpers`
    - Verify UserBook ownership (userId matches current user)
    - Validate book status is COMPLETED
    - Validate CawpileRating exists for the UserBook
    - Generate unique shareToken using nanoid (21 characters minimum)
    - Create SharedReview record with default privacy settings (all true)
    - Return share URL in format: `${NEXTAUTH_URL}/share/reviews/${shareToken}`
    - Error handling: 401 unauthorized, 404 book not found, 400 ineligible book (not completed or no rating)
  - [x] 2.3 Create GET /api/share/reviews/[shareToken]/route endpoint
    - Location: `src/app/api/share/reviews/[shareToken]/route.ts`
    - NO authentication required (public endpoint)
    - Query SharedReview by shareToken with includes: userBook (edition, book, cawpileRating)
    - Return only whitelisted fields: book metadata (title, authors, cover), edition (ISBN, googleBook data), cawpileRating (all facets + computed scores), review text, conditionally: dates (if showDates), bookClubName (if showBookClubs), readathonName (if showReadathons)
    - Error handling: 404 if shareToken not found
    - Set cache headers: public, max-age=3600 (1 hour cache)
  - [x] 2.4 Create DELETE /api/user/books/[id]/share endpoint
    - Location: `src/app/api/user/books/[id]/share/route.ts` (DELETE method)
    - Validate user authentication via `getCurrentUser()`
    - Verify SharedReview exists for userBookId
    - Verify user ownership (userId matches current user)
    - Delete SharedReview record
    - Return 204 No Content on success
    - Error handling: 401 unauthorized, 404 share not found, 403 forbidden (not owner)
  - [x] 2.5 Create PATCH /api/user/books/[id]/share endpoint
    - Location: `src/app/api/user/books/[id]/share/route.ts` (PATCH method)
    - Validate user authentication via `getCurrentUser()`
    - Verify SharedReview exists for userBookId
    - Verify user ownership (userId matches current user)
    - Accept body: { showDates?: boolean, showBookClubs?: boolean, showReadathons?: boolean }
    - Update only provided fields
    - Return updated SharedReview data
    - Error handling: 401 unauthorized, 404 share not found, 403 forbidden, 400 invalid fields
  - [x] 2.6 Ensure API layer tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify critical CRUD operations work
    - Do NOT run the entire test suite at this stage
    - COMPLETED: All 11 API tests pass

**Acceptance Criteria:**
- The 2-8 tests written in 2.1 pass ✅
- All CRUD operations work correctly ✅
- Ownership validation enforced on protected endpoints ✅
- Public endpoint returns correct data without authentication ✅
- Share token generation is cryptographically secure ✅

---

### Frontend Layer

#### Task Group 3: Dashboard Integration and Share Modal
**Dependencies:** Task Group 2

- [ ] 3.0 Complete dashboard integration
  - [ ] 3.1 Write 2-8 focused tests for UI components
    - Limit to 2-8 highly focused tests maximum
    - Test only critical component behaviors (e.g., share button visibility logic, modal privacy toggles, clipboard copy)
    - Skip exhaustive testing of all component states and interactions
  - [ ] 3.2 Add share menu item to BookCard kebab menu
    - Location: `src/components/dashboard/BookCard.tsx`
    - Insert new menu item after "Edit Book" option (around line 265)
    - Icon: ShareIcon from @heroicons/react/24/outline
    - Label: "Share Review"
    - Conditional visibility: only show if book.status === 'COMPLETED' && book.cawpileRating exists
    - onClick handler: open ShareReviewModal with book data
    - Follow existing pattern from EditBookModal integration
  - [ ] 3.3 Create ShareReviewModal component
    - Location: `src/components/modals/ShareReviewModal.tsx`
    - Props: isOpen, onClose, userBook (with cawpileRating, edition, book relations), existingShare (SharedReview | null)
    - Use Headless UI Dialog component (follow pattern from EditBookModal)
    - Modal title: "Share Your Review" or "Update Share Settings"
    - Display book title and cover for context
    - Privacy toggle section with three checkboxes:
      - "Show reading dates" (showDates) - default checked
      - "Show book clubs" (showBookClubs) - default checked, disabled if no bookClubName
      - "Show readathons" (showReadathons) - default checked, disabled if no readathonName
    - If share exists: show current share URL in read-only input with copy button
    - If share exists: show "Update Settings" button (PATCH request) and "Delete Share" button
    - If no share: show "Create Share Link" button (POST request)
    - Copy to clipboard functionality with success feedback toast
    - Loading states during API calls
    - Error handling with error message display
  - [ ] 3.4 Implement clipboard copy utility
    - Location: `src/lib/utils/clipboard.ts` (create if doesn't exist)
    - Function: `copyToClipboard(text: string): Promise<boolean>`
    - Use navigator.clipboard.writeText() with fallback to document.execCommand('copy')
    - Return true on success, false on failure
    - Handle errors gracefully
  - [ ] 3.5 Add share state management to BookCard
    - Location: `src/components/dashboard/BookCard.tsx`
    - Add state: `const [showShareModal, setShowShareModal] = useState(false)`
    - Add state: `const [shareData, setShareData] = useState<SharedReview | null>(null)`
    - Fetch existing share on component mount if book is COMPLETED with rating
    - Optional endpoint: GET /api/user/books/[id]/share to check if share exists
    - Pass shareData to ShareReviewModal as existingShare prop
  - [ ] 3.6 Ensure dashboard integration tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify share button appears for eligible books
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 3.1 pass
- Share button only visible for completed books with ratings
- ShareReviewModal opens and displays correctly
- Privacy toggles function as expected
- Clipboard copy works with success feedback

---

#### Task Group 4: Public Review Page
**Dependencies:** Task Group 2

- [ ] 4.0 Complete public review page
  - [ ] 4.1 Write 2-8 focused tests for public page
    - Limit to 2-8 highly focused tests maximum
    - Test only critical behaviors (e.g., page renders without auth, conditional fields display correctly, 404 on invalid token)
    - Skip exhaustive testing of all scenarios
  - [ ] 4.2 Update middleware to exclude public share routes
    - Location: `src/middleware.ts`
    - Update matcher config to exclude `/share/reviews/:path*` and `/api/share/reviews/:path*`
    - Current pattern excludes `/auth/`, add `/share/` to exclusion list
    - Verify public routes are accessible without authentication
  - [ ] 4.3 Create public review page Server Component
    - Location: `src/app/share/reviews/[shareToken]/page.tsx`
    - Fetch review data server-side via Prisma query (NOT via API route)
    - Direct database query: `prisma.sharedReview.findUnique({ where: { shareToken }, include: { userBook: { include: { edition: { include: { googleBook: true, book: true } }, cawpileRating: true } } } })`
    - Handle 404 if shareToken not found (return notFound() from next/navigation)
    - Pass data to client component for rendering
  - [ ] 4.4 Create PublicReviewDisplay client component
    - Location: `src/components/share/PublicReviewDisplay.tsx`
    - Props: sharedReview (with all relations)
    - Layout: centered card with max-width (similar to dashboard cards)
    - Book metadata section:
      - Cover image (use Next.js Image component, source from googleBook.thumbnail)
      - Book title (large, bold)
      - Authors (subtitle style)
    - CAWPILE rating section:
      - Reuse CawpileFacetDisplay component from `src/components/rating/CawpileFacetDisplay.tsx`
      - Display all 7 facets with scores
      - Show overall score, star rating, grade (use existing StarRating component)
    - Review text section (if exists):
      - Heading: "Review"
      - Display review text with proper formatting (preserve line breaks)
    - Metadata section (conditional):
      - Reading dates (if showDates is true): "Read from {startDate} to {endDate}"
      - Book club (if showBookClubs is true and bookClubName exists): "Book Club: {name}"
      - Readathon (if showReadathons is true and readathonName exists): "Readathon: {name}"
    - Footer: subtle "Powered by Cawpile" text (no link, just branding)
    - Styling: Follow existing TailwindCSS patterns, dark mode support
  - [ ] 4.5 Add metadata to public page for SEO
    - Location: `src/app/share/reviews/[shareToken]/page.tsx`
    - Export metadata object with dynamic title: `{bookTitle} - Review | Cawpile`
    - Description: truncated review text or "CAWPILE rating for {bookTitle}"
    - robots: "noindex, nofollow" (prevent search engine indexing for privacy)
  - [ ] 4.6 Ensure public page tests pass
    - Run ONLY the 2-8 tests written in 4.1
    - Verify page renders correctly with all sections
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 4.1 pass
- Public page accessible without authentication
- All sections render correctly with proper conditional logic
- Dark mode styling works
- 404 handled gracefully for invalid tokens

---

### Testing & Integration

#### Task Group 5: Cross-Layer Integration and Final Testing
**Dependencies:** Task Groups 1-4

- [ ] 5.0 Complete integration testing and validation
  - [ ] 5.1 Review tests from Task Groups 1-4
    - Review the 2-8 tests written by database engineer (Task 1.1)
    - Review the 2-8 tests written by backend engineer (Task 2.1)
    - Review the 2-8 tests written by frontend engineers (Tasks 3.1, 4.1)
    - Total existing tests: approximately 8-32 tests
  - [ ] 5.2 Analyze test coverage gaps for social sharing feature only
    - Identify critical user workflows that lack test coverage
    - Focus ONLY on gaps related to this spec's feature requirements
    - Do NOT assess entire application test coverage
    - Prioritize end-to-end workflows over unit test gaps
    - Key workflows to verify:
      - Full share creation flow: dashboard → modal → API → database
      - Privacy toggle updates: modal → API → database → public page
      - Public page rendering with all conditional fields
      - Share deletion flow: dashboard → API → database
      - Invalid share token handling
  - [ ] 5.3 Write up to 10 additional strategic tests maximum
    - Add maximum of 10 new tests to fill identified critical gaps
    - Focus on integration points and end-to-end workflows
    - Examples of critical tests to consider:
      - E2E: Create share → verify public page displays correctly
      - E2E: Update privacy settings → verify fields hidden/shown on public page
      - Integration: Delete share → verify 404 on public page
      - Edge case: Attempt to share non-completed book (should fail)
      - Edge case: Attempt to share book without rating (should fail)
      - Edge case: Duplicate share creation for same userBook (should fail or return existing)
      - Security: Attempt to delete another user's share (should fail)
    - Do NOT write comprehensive coverage for all scenarios
    - Skip edge cases that are not business-critical
  - [ ] 5.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature (tests from 1.1, 2.1, 3.1, 4.1, and 5.3)
    - Expected total: approximately 18-42 tests maximum
    - Do NOT run the entire application test suite
    - Verify critical workflows pass
  - [ ] 5.5 Manual testing checklist
    - Test in browser: Create share from dashboard for completed book with rating
    - Verify share URL copied to clipboard
    - Test privacy toggles: update settings and verify changes on public page
    - Test in incognito/private window: access public URL without authentication
    - Verify conditional fields display correctly based on privacy settings
    - Test delete share: verify URL returns 404 after deletion
    - Test share button visibility: verify hidden for non-completed books or books without ratings
    - Cross-browser testing: Chrome, Firefox, Safari
    - Mobile responsive testing: verify layout works on mobile devices
  - [ ] 5.6 Performance validation
    - Verify public page loads quickly (server-side rendering)
    - Check database query performance for public review fetch
    - Verify no N+1 query issues in Prisma includes
    - Test clipboard copy performance (should be instant)

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 18-42 tests total)
- Critical user workflows for this feature are covered
- No more than 10 additional tests added when filling in testing gaps
- Testing focused exclusively on this spec's feature requirements
- Manual testing checklist completed successfully
- No performance regressions identified

---

## Execution Order

Recommended implementation sequence:
1. **Database Layer** (Task Group 1) - Foundation with SharedReview model ✅
2. **Backend API Layer** (Task Group 2) - Create, read, update, delete endpoints ✅
3. **Frontend Dashboard Integration** (Task Group 3) - Share button and modal
4. **Frontend Public Page** (Task Group 4) - Public review display
5. **Testing & Integration** (Task Group 5) - Gap analysis and validation

---

## Additional Notes

### Testing Framework Setup
- Jest testing framework configured in `jest.config.ts` ✅
- Test environment: Node.js
- Test files location: `__tests__/` directory
- Mock for nanoid created in `__mocks__/nanoid.ts` ✅
- Environment variables loaded from `.env.local` in `jest.setup.ts` ✅

### Database Considerations
- SharedReview uses String for id field (consistent with Next.js patterns for shareable URLs)
- shareToken should be generated using nanoid library (install: `npm install nanoid`)
- Unique constraint on userBookId prevents duplicate shares per book
- Consider adding index on shareToken for fast public lookups

### API Security Patterns
- Follow existing ownership validation pattern from `src/app/api/user/books/[id]/route.ts`
- Public endpoint must be explicitly excluded from authentication middleware
- Use Prisma select/include carefully to prevent data leakage on public endpoint

### Component Reuse Opportunities
- CawpileFacetDisplay: `src/components/rating/CawpileFacetDisplay.tsx`
- StarRating component: Check `src/components/rating/` directory
- Modal pattern: `src/components/modals/EditBookModal.tsx`
- Kebab menu pattern: `src/components/dashboard/BookCard.tsx` (lines 234-344)

### Dependencies to Install
```bash
npm install nanoid
```

### Environment Variables
No new environment variables required - uses existing NEXTAUTH_URL for share URL generation.

### Migration Rollback Plan
If issues arise, rollback migration:
```bash
npx prisma migrate reset
```
Note: This will clear development database - use with caution.
