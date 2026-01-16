# Task Breakdown: Fix Review Sharing Bugs (HTML Sanitization and Height)

## Overview
Total Tasks: 14
Estimated Complexity: Low-Medium (utility creation + component updates)

## Task List

### Utility Layer

#### Task Group 1: HTML Sanitization Utility
**Dependencies:** None

- [x] 1.0 Complete HTML sanitization utility
  - [x] 1.1 Write 4-6 focused tests for sanitization functions
    - Test `sanitizeHtml()` preserves allowed tags: `<br>`, `<br/>`, `<p>`, `</p>`, `<i>`, `</i>`, `<b>`, `</b>`, `<em>`, `</em>`
    - Test `sanitizeHtml()` strips disallowed tags (e.g., `<script>`, `<a>`, `<div>`, `<span>`)
    - Test `stripHtmlToText()` converts all HTML to plain text with line breaks
    - Test both functions handle null/undefined input gracefully (return empty string)
    - Test edge cases: nested tags, malformed HTML, self-closing variants
  - [x] 1.2 Create `/src/lib/utils/sanitize.ts` with sanitization functions
    - Implement `sanitizeHtml(html: string): string`
      - Uses regex-based approach (no external dependencies)
      - Preserves only allowed tags: `<br>`, `<br/>`, `<p>`, `</p>`, `<i>`, `</i>`, `<b>`, `</b>`, `<em>`, `</em>`
      - Strips all other HTML tags while preserving inner text content
      - Handles null/undefined by returning empty string
    - Implement `stripHtmlToText(html: string): string`
      - Converts `<br>`, `<br/>`, `<p>`, `</p>` to newline characters
      - Strips ALL HTML tags for plain text output
      - Collapses multiple consecutive newlines to single newline
      - Handles null/undefined by returning empty string
    - Export both functions
  - [x] 1.3 Ensure utility tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify edge cases handled correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 1.1 pass
- `sanitizeHtml()` correctly preserves only the specified allowed tags
- `stripHtmlToText()` produces clean plain text with appropriate line breaks
- Both functions are safe against XSS (no script execution possible)
- Import path `@/lib/utils/sanitize` works correctly

---

### Site Version Component

#### Task Group 2: PublicReviewDisplay HTML Rendering and Height Fix
**Dependencies:** Task Group 1

- [x] 2.0 Complete site version fixes
  - [x] 2.1 Write 2-4 focused tests for PublicReviewDisplay description rendering
    - Test description renders HTML formatting (bold, italic) instead of raw tags
    - Test description height is constrained to approximately 6 lines
    - Test XSS prevention (script tags do not execute)
    - Test empty/null description handling
  - [x] 2.2 Update PublicReviewDisplay.tsx to use sanitized HTML
    - Import `sanitizeHtml` from `@/lib/utils/sanitize`
    - Line 119: Change from `{description}` to `dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}`
    - Update the element to a `<div>` instead of `<p>` to properly contain block-level elements
    - Maintain existing CSS classes for styling consistency
  - [x] 2.3 Adjust height constraints in PublicReviewDisplay.tsx
    - Line 118: Change `max-h-72` (288px) to `max-h-40` (160px)
    - Line 119: Change `line-clamp-[12]` to `line-clamp-6`
    - Verify overflow behavior works correctly with HTML content
  - [x] 2.4 Ensure site version tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify HTML renders correctly instead of showing raw tags
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 2.1 pass
- Description displays formatted text (bold, italic, line breaks) properly
- Raw HTML tags no longer visible as text
- Description height reduced to ~160px / 6 lines
- No XSS vulnerabilities (script injection blocked)

---

### Image Version Component

#### Task Group 3: ReviewImageTemplate HTML Stripping and Height Fix
**Dependencies:** Task Group 1

- [x] 3.0 Complete image version fixes
  - [x] 3.1 Write 2-4 focused tests for ReviewImageTemplate description handling
    - Test description is plain text (no HTML tags visible)
    - Test description character limit increased to 350
    - Test HTML line breaks convert to spaces or newlines appropriately
    - Test truncation works correctly with sanitized text
  - [x] 3.2 Update ReviewImageTemplate.tsx to strip HTML from descriptions
    - Import `stripHtmlToText` from `@/lib/utils/sanitize`
    - Apply sanitization BEFORE character truncation (before line 90)
    - Update truncation logic to work with sanitized plain text
    - Pattern: `const cleanDescription = stripHtmlToText(book.description)`
  - [x] 3.3 Adjust character limit and height in ReviewImageTemplate.tsx
    - Line 89: Change `MAX_DESCRIPTION_CHARS` from 200 to 350
    - Line 254: Change `maxHeight` from 90px to 140px
    - These changes allow approximately 5-6 lines of description text
  - [x] 3.4 Ensure image version tests pass
    - Run ONLY the 2-4 tests written in 3.1
    - Verify description shows as plain text without HTML tags
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 3.1 pass
- Description displays as clean plain text (no HTML tags)
- Character limit is 350 (increased from 200)
- Description height is 140px (increased from 90px)
- Truncation occurs at word boundaries with ellipsis

---

### Verification

#### Task Group 4: Integration Verification and Visual Validation
**Dependencies:** Task Groups 1-3

- [x] 4.0 Verify complete implementation
  - [x] 4.1 Run all feature-specific tests together
    - Run tests from Task Groups 1, 2, and 3 together
    - Expected total: approximately 8-14 tests
    - Verify no regressions between components
  - [x] 4.2 Manual visual verification against reference screenshots
    - Compare site version output to `planning/visuals/current-site-sharing.png`
    - Verify HTML tags no longer display as raw text
    - Verify description height is appropriately constrained
    - Compare image version output to `planning/visuals/current-image-sharing.png`
    - Verify plain text description shows more content (~5-6 lines)
  - [x] 4.3 Verify build succeeds
    - Run `npm run build` to ensure no TypeScript errors
    - Run `npm run lint` to ensure code quality
    - Verify no import errors for new utility

**Acceptance Criteria:**
- All 8-14 feature-specific tests pass
- Build completes without errors
- Lint passes without errors
- Visual inspection confirms bugs are fixed

---

## Execution Order

Recommended implementation sequence:

1. **Utility Layer (Task Group 1)** - Create sanitization utility first as both components depend on it
2. **Site Version (Task Group 2)** - Update PublicReviewDisplay with HTML rendering and height fix
3. **Image Version (Task Group 3)** - Update ReviewImageTemplate with HTML stripping and height fix
4. **Verification (Task Group 4)** - Run all tests and verify visual output

## File Change Summary

| File | Changes |
|------|---------|
| `/src/lib/utils/sanitize.ts` | NEW - Create with `sanitizeHtml()` and `stripHtmlToText()` |
| `/src/components/share/PublicReviewDisplay.tsx` | UPDATE - Lines 118-119: `dangerouslySetInnerHTML`, height reduction |
| `/src/components/share/ReviewImageTemplate.tsx` | UPDATE - Lines 89, 90-94, 254: character limit, sanitization, height |

## Notes

- **No external dependencies**: The sanitization uses regex-based approach to keep bundle size small
- **XSS Safety**: Only specific safe tags are allowed; all script/event handlers are stripped
- **html2canvas limitation**: Image template cannot render HTML, hence plain text requirement
- **Existing pattern reuse**: The `truncateReviewText()` function in `generateReviewImage.ts` provides the word-boundary truncation pattern
