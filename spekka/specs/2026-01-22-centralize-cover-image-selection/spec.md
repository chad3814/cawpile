# Specification: Centralize Cover Image Selection

## Goal
Fix inconsistent cover image selection across the application by ensuring all book cover displays use the existing `getCoverImageUrl()` utility with proper multi-provider fallback and user preference support.

## User Stories
- As a user, I want my preferred cover image provider selection to be respected on my public profile, shared reviews, and generated share images so that my book displays look consistent everywhere.
- As a user, I want the best available cover image to be shown automatically (Hardcover > Google > IBDB) when I haven't set a preference, regardless of where the book is displayed.

## Specific Requirements

**Update Profile Type Definitions**
- Add `hardcoverBook` and `ibdbBook` image URL fields to `ProfileBookData.edition` type
- Add `hardcoverBook` and `ibdbBook` image URL fields to `ProfileSharedReview.userBook.edition` type
- Add `preferredCoverProvider` field to relevant profile types where user preference should be respected
- Follow same pattern as `DashboardBookData` which already includes all three providers

**Update Database Queries for Profile Data**
- Modify `getProfileCurrentlyReading.ts` to include `hardcoverBook` and `ibdbBook` relations in query
- Modify `getProfileTbr.ts` to include `hardcoverBook` and `ibdbBook` relations in query
- Modify `getProfileSharedReviews.ts` to include `hardcoverBook` and `ibdbBook` relations in query
- Include `preferredCoverProvider` from `UserBook` in query results
- Only select `imageUrl` field from each provider (not entire objects) to minimize data transfer

**Update Profile Components to Use Centralized Utility**
- `ProfileBookCard.tsx`: Import and use `getCoverImageUrl()` instead of direct `googleBook?.imageUrl` access
- `TbrBookCard.tsx`: Import and use `getCoverImageUrl()` instead of direct `googleBook?.imageUrl` access
- `SharedReviewCard.tsx`: Import and use `getCoverImageUrl()` instead of direct `googleBook?.imageUrl` access
- Pass `preferredCoverProvider` to `getCoverImageUrl()` where available

**Update Public Review Display**
- `PublicReviewDisplay.tsx`: Import and use `getCoverImageUrl()` for cover image selection
- Update component props interface to include all provider image URLs
- Update the `/api/share/reviews/[shareToken]/route.ts` API to return all provider image URLs

**Update Share Review Modal**
- `ShareReviewModal.tsx`: Use `getCoverImageUrl()` for book context thumbnail and image template
- Ensure the modal receives edition data with all provider image URLs
- Props already receive edition from parent; verify parent passes complete data

**Update Review Image Template**
- `ReviewImageTemplate.tsx`: Already receives `coverUrl` as prop; no component changes needed
- Caller (`ShareReviewModal`) must pass the correctly selected cover URL using `getCoverImageUrl()`

**Extend Image Proxy for All Providers**
- Update `/api/proxy/image/route.ts` to allow Hardcover and IBDB domains in addition to Google Books
- Add Hardcover CDN domains to allowed list (e.g., `cdn.hardcover.app`, `hardcover.app`)
- Add IBDB image domains to allowed list (identify actual domains used)
- Maintain existing security: validate URLs, reject unknown domains

**Create Proxy-Aware Cover URL Helper**
- Create a new utility `getProxiedCoverImageUrl()` that wraps `getCoverImageUrl()` and returns a proxied URL for use in image generation contexts
- This helper should only proxy when needed (e.g., for html2canvas scenarios)
- Can be placed alongside existing utility or as extension

## Existing Code to Leverage

**`/src/lib/utils/getCoverImageUrl.ts`**
- Complete multi-provider fallback logic already implemented (Hardcover > Google > IBDB)
- Supports `preferredProvider` parameter for user preference override
- Already used correctly in `BookCard.tsx` and `BookTable.tsx` on the dashboard
- Should be imported and used identically in all other cover display locations

**`/src/types/dashboard.ts` - DashboardBookData Interface**
- Shows correct pattern for including all three provider image URLs in edition type
- Pattern: `hardcoverBook: { imageUrl: string | null } | null`
- Profile types should mirror this structure

**`/api/proxy/image/route.ts`**
- Existing image proxy infrastructure for CORS handling
- Currently allows Google Books domains only
- Needs domain list expansion for Hardcover and IBDB

**Dashboard Component Pattern (`BookCard.tsx`)**
- Shows correct usage: `const imageUrl = getCoverImageUrl(book.edition, book.preferredCoverProvider)`
- This exact pattern should be replicated in all profile and share components

## Out of Scope
- Adding UI for users to change their preferred cover provider (already exists in EditBookModal)
- Changing the priority order of providers (Hardcover > Google > IBDB is confirmed correct)
- Caching of proxied images beyond current 24-hour browser cache
- Fetching cover images from new providers not already in the system
- Admin interface cover image selection (admin views book data, not user preferences)
- Book search result cover images (search results come from providers directly, not user library)
- Modifying the `getCoverImageUrl()` utility function logic itself
- Adding fallback placeholder images when no cover is available (existing SVG placeholder is sufficient)
