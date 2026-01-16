# Specification: Fix Review Sharing Bugs (HTML Sanitization and Height)

## Goal
Fix two bugs in the review sharing feature: (1) raw HTML tags displaying as text in book descriptions, and (2) incorrect description height constraints in both site and image versions.

## User Stories
- As a user sharing my review, I want the book description to display formatted text (bold, italic, line breaks) properly so the share looks professional
- As a user generating a shareable image, I want the description to show enough content to be useful without being cut off too abruptly

## Specific Requirements

**HTML Sanitization Utility**
- Create a new utility function `sanitizeHtmlForDisplay` in `/src/lib/utils/sanitize.ts`
- Strip ALL HTML tags EXCEPT allowed tags: `<br>`, `<br/>`, `<p>`, `</p>`, `<i>`, `</i>`, `<b>`, `</b>`, `<em>`, `</em>`
- Convert `<br>` and `<br/>` to newline characters for plain text contexts
- Use regex-based approach (no external dependencies) for simplicity and bundle size
- Export both a version that outputs clean HTML and a version that outputs plain text with newlines

**Site Version HTML Rendering (PublicReviewDisplay)**
- Update description rendering on line 119 to use `dangerouslySetInnerHTML` with sanitized HTML
- Change from plain text `{description}` to rendered HTML output
- Maintain existing CSS classes for styling consistency
- Ensure XSS safety by only allowing the specified safe tags

**Site Version Height Adjustment (PublicReviewDisplay)**
- Reduce `max-h-72` (288px) to `max-h-40` (160px) on line 118
- Change `line-clamp-[12]` to `line-clamp-6` for approximately 6 lines of text
- These values constrain the description to a reasonable preview size

**Image Version HTML Stripping (ReviewImageTemplate)**
- Description must be converted to plain text (strip ALL tags, convert line breaks to spaces or newlines)
- Apply sanitization before the existing character truncation on line 90-94
- Image templates cannot render HTML due to `html2canvas` limitations

**Image Version Height Adjustment (ReviewImageTemplate)**
- Increase `MAX_DESCRIPTION_CHARS` from 200 to 350 characters on line 89
- Increase `maxHeight` from 90px to 140px on line 254 to accommodate more content
- This allows approximately 5-6 lines of description text vs current ~3 lines

**Sanitization Function Signature**
- `sanitizeHtmlForDisplay(html: string): string` - returns sanitized HTML with only allowed tags
- `sanitizeHtmlToPlainText(html: string): string` - returns plain text with HTML stripped and line breaks converted
- Both functions should handle null/undefined gracefully by returning empty string

## Visual Design

**`planning/visuals/current-site-sharing.png`**
- Raw HTML tags visible: `<b>`, `</b>`, `<br>`, `<i>`, `</i>` displayed as literal text
- Description area shows excessive content extending beyond reasonable preview
- Tags like `<br><b>` appearing mid-text where formatting should render
- Book shown: "The Name of the Wind" - demonstrates real Google Books API data

**`planning/visuals/current-image-sharing.png`**
- Same raw HTML tags visible as text in the image template
- Description truncated after approximately 3 lines (~200 chars)
- Truncation cuts off important book description context
- CAWPILE rating section and review render correctly below

## Existing Code to Leverage

**`/src/lib/image/generateReviewImage.ts` - truncateReviewText function**
- Existing text truncation utility on lines 30-47
- Truncates at word boundaries to avoid cutting words
- Can be reused after HTML is stripped to plain text
- Pattern: find last space within threshold, truncate there with ellipsis

**`/src/lib/utils/` directory structure**
- Existing utils directory at `/src/lib/utils/` contains `clipboard.ts`
- New `sanitize.ts` utility file follows established organization pattern
- Import path will be `@/lib/utils/sanitize`

**`/src/components/share/ReviewImageTemplate.tsx` - description handling**
- Lines 87-94 show current character-based truncation approach
- `MAX_DESCRIPTION_CHARS` constant controls truncation length
- `maxHeight` style property on line 254 constrains visual height
- Pattern can be extended with sanitization step before truncation

**`/src/components/share/PublicReviewDisplay.tsx` - description rendering**
- Lines 117-122 show current plain text rendering approach
- Uses `whitespace-pre-wrap` and `line-clamp-[12]` for styling
- `max-h-72` constrains height - needs reduction
- Will need `dangerouslySetInnerHTML` for HTML rendering

## Out of Scope
- Changing how book descriptions are fetched from Google Books API
- Modifying description storage in the database
- HTML sanitization for any components other than PublicReviewDisplay and ReviewImageTemplate
- Changes to the review text field (user-written reviews, not book descriptions)
- Any styling changes beyond the specified height adjustments
- Adding new UI elements or features to the sharing components
- Server-side HTML sanitization or pre-processing
- Supporting additional HTML tags beyond the specified allowed list
- Mobile-specific layout adjustments
- Accessibility improvements beyond proper HTML rendering
