# Spec Requirements: Shareable Review Image Generation

## Initial Description

When a user shares a review, we need to optionally generate an image review that they can post to Instagram or TikTok.

## Requirements Discussion

### First Round Questions

**Q1:** Should this be an additional option alongside the existing URL-based sharing, or a replacement for current share functionality?
**Answer:** Additional option alongside URL sharing. Image generation is an add-on, not a replacement.

**Q2:** What image dimensions/aspect ratios should be supported (e.g., square 1:1 for Instagram, 9:16 for Stories/TikTok, or multiple options)?
**Answer:** Single size only: 1080x1920 (story/TikTok format, 9:16 aspect ratio).

**Q3:** What content should appear on the generated image (book cover, title, author, CAWPILE ratings breakdown, overall score, user avatar, branding)?
**Answer:** Book cover, title, author(s), CAWPILE rating breakdown (7 facets with scores), overall average/stars, Cawpile branding, AND written review text (as much as fits).

**Q4:** Should users be able to customize the image styling (color themes, fonts, layouts) or use a single consistent branded look?
**Answer:** Single consistent branded look. No user customization.

**Q5:** Should image generation happen client-side (html2canvas) or server-side (puppeteer/canvas API)?
**Answer:** Client-side using html2canvas or similar library.

**Q6:** What's the expected user flow - Share button opens modal with image preview and download option, or automatic download?
**Answer:** Share button opens ShareReviewModal with "Generate Image" option, then preview, then download.

**Q7:** Should the generated image respect existing share privacy settings (showing/hiding dates, book clubs, readathons)?
**Answer:** Yes, use existing share privacy settings (show/hide dates, book clubs, readathons).

**Q8:** Are there any features explicitly NOT wanted in this implementation (user avatars, custom text overlays, multi-book summaries)?
**Answer:** Only basics laid out above. No extra features like user avatars, custom text overlays, multi-book summaries.

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

No follow-up questions needed. Requirements are comprehensive and unambiguous.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

N/A - No visual files found in the visuals folder.

## Requirements Summary

### Functional Requirements

- Generate shareable images from book reviews for social media posting
- Single image size: 1080x1920 pixels (9:16 aspect ratio for Instagram Stories/TikTok)
- Image content includes:
  - Book cover image
  - Book title
  - Author name(s)
  - CAWPILE rating breakdown showing all 7 facets with individual scores
  - Overall average rating and star display
  - Written review text (truncated to fit available space)
  - Cawpile branding element
- Client-side image generation using html2canvas or similar library
- Respect existing share privacy settings for conditional content display
- Single consistent branded visual design (no user customization)

### User Flow

1. User clicks Share button on a completed book review
2. ShareReviewModal opens (existing modal)
3. User selects "Generate Image" option (new option in modal)
4. Image preview is displayed to user
5. User can download the generated image

### Reusability Opportunities

- Existing ShareReviewModal component (to be extended with new option)
- Existing share privacy settings logic
- Existing CAWPILE rating display components (for reference on data structure)
- Existing book cover/title/author display patterns

### Scope Boundaries

**In Scope:**
- Image generation feature as additional share option
- Single 1080x1920 image format
- Book cover, title, author, 7-facet CAWPILE ratings, average/stars, review text, branding
- Client-side generation with html2canvas or similar
- Preview before download
- Privacy setting integration
- Single branded design

**Out of Scope:**
- User avatars on generated images
- Custom text overlays
- Multi-book summary images
- Multiple image sizes or aspect ratios
- User-customizable themes/colors/fonts
- Server-side image generation
- Direct posting to social media (user downloads and posts manually)
- Replacing existing URL-based sharing

### Technical Considerations

- Client-side library: html2canvas or similar for DOM-to-image conversion
- Image dimensions: 1080x1920 pixels (9:16 aspect ratio)
- Must handle variable-length review text with graceful truncation
- Must handle missing book covers gracefully
- Integration point: Extend existing ShareReviewModal component
- Privacy data: Conditionally include dates, book clubs, readathons based on user settings
- Branding: Consistent Cawpile branding element to be designed
