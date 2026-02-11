# Spec Requirements: Stars Missing in Rendered Video

## Initial Description

Stars are missing in the rendered video - perhaps the font used within the Docker container doesn't have the star emoji.

## Requirements Discussion

### Research Findings (Self-Directed Investigation)

The following analysis was conducted by examining the codebase to understand the root cause and determine the appropriate fix.

#### Root Cause Analysis

**Location of Issue:**
`/Users/cwalker/Projects/cawpile-video-gen/main/src/compositions/MonthlyRecap/BookReveal.tsx` (lines 257-258)

**Problematic Code:**
```tsx
{isFilled ? '⭐' : '☆'}
```

The component uses two different star characters:
- `⭐` (U+2B50): Full-color star emoji for filled stars
- `☆` (U+2606): White star Unicode character for empty stars

**Docker Environment:**
The Dockerfile (`/Users/cwalker/Projects/cawpile-video-gen/main/Dockerfile`) uses `node:22-bookworm-slim` as the base image. This is a minimal Debian-based image that does not include emoji fonts by default.

The Dockerfile installs dependencies for Chrome Headless Shell (required for Remotion rendering) but does not install any font packages that support emoji characters:
- `libnss3`, `libdbus-1-3`, `libatk1.0-0`, `libgbm-dev`, `libasound2`
- `libxrandr2`, `libxkbcommon-dev`, `libxfixes3`, `libxcomposite1`, `libxdamage1`
- `libatk-bridge2.0-0`, `libpango-1.0-0`, `libcairo2`, `libcups2`, `curl`

None of these include emoji font support.

#### Font Configuration Context

From `/Users/cwalker/Projects/cawpile-video-gen/main/src/lib/theme.ts`:
```ts
export const FONTS = {
  heading: 'Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, sans-serif',
  mono: 'JetBrains Mono, monospace',
} as const
```

The application relies on system fonts. On macOS (where development likely happens), emoji fonts are included by default. In the Docker container, these are missing.

### Existing Code to Reference

**Similar Features Identified:**
- File: `/Users/cwalker/Projects/cawpile-video-gen/main/src/lib/theme.ts` contains `convertToStars()` function that converts numeric ratings to star counts
- The star rendering is localized to `BookReveal.tsx` - no other components use star emojis

**Backend patterns:**
- No server-side star rendering exists; this is purely a frontend rendering issue

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements

1. **Star ratings must render correctly in Docker environment**
   - Filled stars should display for ratings earned
   - Empty stars should display for ratings not earned
   - Stars must be visually consistent (same size, alignment)

2. **Rating display must match existing behavior**
   - 5-star display system based on `convertToStars()` logic
   - Stars appear with slam-down animation (staggered appearance)
   - Visual appearance should match macOS development environment

3. **Solution must not break local development**
   - Changes should work in both Docker and local environments
   - No regression in Remotion Studio preview

### Solution Options (Recommended Approach)

**Option A: Install Emoji Font in Docker (Recommended)**
Install `fonts-noto-color-emoji` in the Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-noto-color-emoji \
    ...
```

Pros:
- Minimal code changes
- Preserves emoji aesthetic
- Works with any future emoji usage

Cons:
- Increases Docker image size (~10MB)
- Color emoji may render differently than on macOS

**Option B: Replace Emojis with Unicode Symbols**
Replace star emoji with Unicode star symbols that are more widely supported:
- Filled: `\u2605` (BLACK STAR)
- Empty: `\u2606` (WHITE STAR)

```tsx
{isFilled ? '\u2605' : '\u2606'}
```

Pros:
- No Docker changes needed
- Smaller image size
- Consistent rendering across platforms

Cons:
- Stars will be monochrome (styled with CSS color)
- Different aesthetic than emoji stars

**Option C: SVG Star Components**
Create inline SVG stars as React components:

Pros:
- Complete control over appearance
- No font dependencies
- Scalable and customizable

Cons:
- More code changes required
- Need to design star appearance

**Recommended Decision: Option B (Unicode Symbols)**

Rationale:
1. Simplest implementation with minimal risk
2. The empty star already uses Unicode (`\u2606`), making this consistent
3. Stars can be styled with the existing rating color system
4. No Docker image changes required
5. The visual of monochrome stars with color styling (gold/yellow) is a common and acceptable pattern

### Scope Boundaries

**In Scope:**
- Fix star rendering in Docker container
- Ensure stars display correctly in BookReveal component
- Verify fix works in both Docker and local environments
- Maintain existing animation behavior

**Out of Scope:**
- Redesigning the star rating system
- Adding new font support beyond what's needed for stars
- Changing the rating calculation logic
- UI changes beyond the star character fix

### Technical Considerations

1. **File to Modify:**
   - `/Users/cwalker/Projects/cawpile-video-gen/main/src/compositions/MonthlyRecap/BookReveal.tsx`

2. **Testing Strategy:**
   - Build Docker image and run render
   - Verify stars appear in output video
   - Compare with local render to ensure consistency

3. **Alternative if Unicode fails:**
   - If `\u2605` also fails to render, fall back to Option A (install emoji font)
   - The Unicode BLACK STAR is well-supported but should be verified

4. **Color Styling:**
   - Currently stars inherit default text color
   - May want to add explicit color styling (gold/yellow) for filled stars
   - Empty stars could be styled with muted color

### Implementation Notes

The fix in BookReveal.tsx line 258 should change from:
```tsx
{isFilled ? '⭐' : '☆'}
```

To:
```tsx
{isFilled ? '\u2605' : '\u2606'}
```

With optional color styling:
```tsx
<span
  key={i}
  style={{
    display: 'inline-block',
    transform: `translateY(${translateY}px) scale(${scale})`,
    opacity,
    color: isFilled ? '#FFD700' : COLORS.textMuted, // Gold for filled, muted for empty
  }}
>
  {isFilled ? '\u2605' : '\u2606'}
</span>
```
