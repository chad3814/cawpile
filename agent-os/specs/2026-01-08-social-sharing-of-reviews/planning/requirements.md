# Spec Requirements: Social Sharing of Reviews

## Initial Description
Social sharing of reviews feature for Cawpile - allowing users to share their book reviews (with CAWPILE ratings) via public links. Users can generate a shareable URL that displays a read-only, publicly-accessible review page without requiring authentication.

## Requirements Discussion

### First Round Questions

**Q1:** What content should be included in the shared review?
**Answer:** The share should include:
- All 7 CAWPILE rating facets (Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment)
- Overall score, stars, and grade
- Written review text (if any)
- Book cover, title, and author
- Reading dates (with opt-out option - included by default, user can toggle off)

**Q2:** What sharing method should we use?
**Answer:** Shareable link only (direct URL to public review page). NO image card generation in this version - that's a future feature.

**Q3:** How should privacy work - opt-in per review, opt-out per review, or global settings?
**Answer:** User must explicitly share from kebab menu on book card in dashboard. Per-review opt-in only (no global settings).

**Q4:** Should only completed books be shareable, or any status?
**Answer:** Completed books only.

**Q5:** Should there be a card design for social media previews (Open Graph)?
**Answer:** Not applicable - no image card generation in this version.

**Q6:** Should the public review page require authentication, or be publicly accessible?
**Answer:** Publicly accessible without authentication. Read-only, purely informational. No call-to-action to join Cawpile.

**Q7:** Can users control which fields are visible (e.g., hide dates, book clubs, readathons)?
**Answer:** Yes - reading dates, book clubs, and readathons can be toggled. Default: all three are shared (user can opt-out).

**Q8:** What features should be excluded from this version?
**Answer:**
- No social comments
- No follower systems
- No embedding on external websites
- Just show the review

### Existing Code to Reference
No similar existing features identified for reference.

### Follow-up Questions
None required - requirements are comprehensive and clear.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No visual assets to analyze.

## Requirements Summary

### Functional Requirements

**Core Sharing Flow:**
- User completes a book with CAWPILE rating
- User clicks kebab menu on book card in dashboard
- User selects "Share Review" option
- System generates unique shareable URL
- User can toggle visibility of: reading dates, book clubs, readathons (default: all shown)
- System copies URL to clipboard or displays for manual copying
- Public page is immediately accessible via URL without authentication

**Content Display on Public Page:**
- Book metadata:
  - Cover image
  - Title
  - Author(s)
- CAWPILE rating visualization:
  - All 7 facets with individual scores (Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment)
  - Overall computed score
  - Star rating
  - Letter grade
- User-written review text (if provided)
- Conditional fields (based on user toggle):
  - Reading dates (start date, end date)
  - Book clubs (if associated)
  - Readathons (if associated)

**Eligibility Rules:**
- Only books with status = COMPLETED can be shared
- Must have at least a CAWPILE rating (review text optional)
- User must be authenticated to generate share link
- Public page requires no authentication to view

**Privacy Controls:**
- Per-review opt-in (explicit action required to share)
- User can toggle visibility of: dates, book clubs, readathons
- No global "make all reviews public" setting
- User identity not displayed on public page (anonymous review)

**URL Structure:**
- Unique, non-guessable identifier for each share
- Permanent link (does not expire)
- Format suggestion: `/share/reviews/{unique-id}` or `/r/{unique-id}`

### Reusability Opportunities
No components identified as reusable from existing features, but should reference:
- Book display patterns from dashboard (title, author, cover display)
- CAWPILE rating display components from `components/rating/`
- Kebab menu pattern from dashboard book cards
- Book card structure from `components/dashboard/`

### Scope Boundaries

**In Scope:**
- Generate unique shareable URL for completed book reviews
- Public review page (read-only, no authentication)
- Display all CAWPILE rating facets + computed scores
- Display book metadata (cover, title, author)
- Display review text if provided
- Conditional display of reading dates, book clubs, readathons (user-toggled)
- Kebab menu integration on dashboard book cards
- Share action only for completed books
- URL copy functionality

**Out of Scope:**
- Image card generation for social media previews
- Social comments or interactions on public page
- Follower systems or user profiles
- Embedding reviews on external websites
- Global privacy settings (all shares are per-review opt-in)
- Edit/delete from public page (must be done in dashboard)
- Open Graph meta tags for rich social previews (future enhancement)
- Share analytics (view counts, etc.)
- Sharing in-progress reads or want-to-read books
- User identity display on public page

### Technical Considerations

**Database Schema Changes Needed:**
- New model: `SharedReview` or `ReviewShare`
  - Fields: `id` (unique share identifier), `userId`, `userBookId`, `shareUrl`, `createdAt`, `showDates` (boolean), `showBookClubs` (boolean), `showReadathons` (boolean)
  - Unique constraint on `userBookId` (one share per user book)
  - Relationship to `UserBook` model

**API Endpoints Required:**
- `POST /api/user/books/[id]/share` - Generate share link with privacy preferences
- `GET /api/share/reviews/[shareId]` - Fetch public review data
- `DELETE /api/user/books/[id]/share` - Remove/unshare review
- `PATCH /api/user/books/[id]/share` - Update privacy preferences (toggle dates, clubs, readathons)

**Frontend Components Needed:**
- Share button/option in kebab menu (dashboard book card)
- Share modal with privacy toggles (dates, clubs, readathons)
- Public review page component (`app/share/reviews/[shareId]/page.tsx`)
- Copy-to-clipboard functionality for share URL
- CAWPILE rating display component (may already exist, reuse if available)

**Authentication Considerations:**
- Public page route must be excluded from NextAuth middleware protection
- API endpoint for public review must not require authentication
- Generation/deletion endpoints must verify user owns the book

**URL Generation:**
- Use cryptographically secure random identifier (e.g., nanoid, uuid)
- Must be URL-safe and non-guessable
- Suggested pattern: `/share/reviews/{unique-id}` or shortened `/r/{unique-id}`

**Similar Code Patterns to Follow:**
- RESTful API route patterns from existing API structure
- Server Component patterns from dashboard pages
- Modal patterns from `components/modals/`
- Kebab menu integration similar to existing book card actions
- Database operations via Prisma following `src/lib/db/` utility patterns
