# Specification: Shareable Review Image Generation

## Goal
Enable users to generate downloadable social media images (1080x1920) from their book reviews for posting to Instagram Stories or TikTok, as an additional option within the existing share functionality.

## User Stories
- As a reader, I want to generate a shareable image of my book review so that I can post it to Instagram Stories or TikTok
- As a privacy-conscious user, I want my existing share privacy settings (dates, book clubs, readathons) to be respected in the generated image

## Specific Requirements

**Image Generation Option in ShareReviewModal**
- Add "Generate Image" button to the existing ShareReviewModal component
- Button should appear alongside existing URL-based sharing functionality
- Clicking the button transitions modal to show image preview and download option
- Only available for completed books with CAWPILE ratings (same eligibility as URL sharing)

**Image Dimensions and Format**
- Single fixed size: 1080x1920 pixels (9:16 aspect ratio)
- Output format: PNG for quality preservation
- Client-side generation using html2canvas or dom-to-image library
- No server-side rendering or API endpoints required

**Image Content Layout**
- Book cover image positioned prominently (handle missing covers with placeholder)
- Book title displayed with clear typography
- Author name(s) listed below title
- All 7 CAWPILE facet scores displayed with facet names
- Overall average rating shown numerically (e.g., "7.8/10")
- Star rating visual representation
- Written review text (truncated with ellipsis if exceeds available space)
- Cawpile branding element at bottom

**Privacy Settings Integration**
- Read existing share privacy settings from SharedReview data (showDates, showBookClubs, showReadathons)
- Conditionally include reading dates based on showDates setting
- Conditionally include book club name based on showBookClubs setting
- Conditionally include readathon name based on showReadathons setting
- If no SharedReview exists yet, use current toggle values from modal state

**Review Text Handling**
- Display user's written review text from userBook.review field
- Calculate available space for review text dynamically
- Truncate with "..." if text exceeds available height
- Handle empty/null review gracefully (omit section entirely)

**Image Preview State**
- Show loading spinner while image is being generated
- Display generated image preview scaled to fit modal viewport
- Provide "Download" button below preview
- Provide "Back" button to return to main share options
- Handle generation errors with user-friendly message

**Download Functionality**
- Generate filename: `cawpile-review-{book-title-slug}.png`
- Trigger browser download using data URL or blob
- Mobile-friendly download behavior (may save to Photos on iOS/Android)

**Branded Visual Design**
- Dark background (#0f172a or similar from globals.css dark theme)
- White/light text for contrast
- Orange accent color (#f97316) for emphasis elements
- Clean, modern typography using system fonts
- Cawpile logo or wordmark in footer area
- Consistent padding and spacing throughout

## Visual Design
No visual mockups provided. Implementation should follow existing app design language with dark background optimized for social media viewing.

## Existing Code to Leverage

**ShareReviewModal (`/src/components/modals/ShareReviewModal.tsx`)**
- Extend with new "Generate Image" option button
- Access existing privacy toggle state (showDates, showBookClubs, showReadathons)
- Use existing modal structure patterns (Dialog, Transition from Headless UI)
- Reuse userBook prop interface for book data access

**CawpileFacetDisplay (`/src/components/rating/CawpileFacetDisplay.tsx`)**
- Reference facet rendering logic and color coding (getCawpileColor)
- Use getFacetConfig() to get correct facet names based on book type
- Adapt display pattern for static image layout

**StarRating (`/src/components/rating/StarRating.tsx`)**
- Reference convertToStars() and getStarEmojis() from types/cawpile.ts
- Replicate star display logic for image canvas

**PublicReviewDisplay (`/src/components/share/PublicReviewDisplay.tsx`)**
- Reference overall layout structure and data access patterns
- Use same date formatting approach (toLocaleDateString)
- Reference conditional metadata section rendering logic

**Types and Utilities (`/src/types/cawpile.ts`)**
- Import getFacetConfig, calculateCawpileAverage, convertToStars, getCawpileColor
- Use FICTION_FACETS and NONFICTION_FACETS for facet names
- Leverage existing grade/star conversion functions

## Out of Scope
- User avatars or profile information on generated images
- Custom text overlays or user-editable text
- Multi-book summary images or year-in-review compilations
- Multiple image sizes or aspect ratio options
- User-customizable themes, colors, or fonts
- Server-side image generation (puppeteer, canvas API)
- Direct posting to social media platforms (Instagram, TikTok APIs)
- Replacing or deprecating existing URL-based sharing
- Animated images or video generation
- Watermark customization options
