# Video Template JSON Schema

This document describes the JSON schema for customizing video rendering in the Cawpile video generator. Templates can be passed to `/render` or `/render-stream` endpoints to customize colors, fonts, timing, and layout of generated videos.

## Quick Start

```json
{
  "global": {
    "colors": {
      "accent": "#3b82f6"
    }
  },
  "intro": {
    "layout": "minimal"
  },
  "bookReveal": {
    "layout": "grid"
  }
}
```

All properties are optional. Unspecified values use defaults. Unknown properties are silently stripped (permissive validation).

## API Usage

### POST /render

```bash
curl -X POST http://localhost:3001/render \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "data": { ... },
    "template": {
      "global": { "colors": { "accent": "#3b82f6" } }
    }
  }'
```

### GET /render-stream

```bash
curl "http://localhost:3001/render-stream?userId=user-123&data=...&template=%7B%22global%22%3A%7B%22colors%22%3A%7B%22accent%22%3A%22%233b82f6%22%7D%7D%7D"
```

The `template` query parameter must be URL-encoded JSON.

---

## Schema Reference

### Top-Level Structure

```typescript
interface VideoTemplate {
  global?: GlobalTemplateConfig
  intro?: IntroConfig
  bookReveal?: BookRevealConfig
  statsReveal?: StatsRevealConfig
  comingSoon?: ComingSoonConfig
  outro?: OutroConfig
}
```

---

## Global Configuration

Applies across all sequences.

```json
{
  "global": {
    "colors": { ... },
    "fonts": { ... },
    "timing": { ... }
  }
}
```

### Colors

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `background` | string | `#0a0a0a` | Main background color |
| `backgroundSecondary` | string | `#111111` | Secondary background |
| `backgroundTertiary` | string | `#1a1a1a` | Tertiary background |
| `textPrimary` | string | `#ffffff` | Primary text color |
| `textSecondary` | string | `#a1a1aa` | Secondary text color |
| `textMuted` | string | `#71717a` | Muted text color |
| `accent` | string | `#f97316` | Primary accent (brand orange) |
| `accentSecondary` | string | `#fb923c` | Secondary accent |
| `accentMuted` | string | `#c2410c` | Muted accent |
| `completed` | string | `#22c55e` | Completed status (green) |
| `dnf` | string | `#ef4444` | DNF status (red) |
| `ratingHigh` | string | `#22c55e` | Rating 8-10 (green) |
| `ratingMedium` | string | `#eab308` | Rating 5-7 (yellow) |
| `ratingLow` | string | `#ef4444` | Rating 1-4 (red) |
| `overlay` | string | `rgba(0,0,0,0.7)` | Overlay color |
| `grain` | string | `rgba(255,255,255,0.02)` | Grain effect |

**Example: Blue theme**
```json
{
  "global": {
    "colors": {
      "accent": "#3b82f6",
      "accentSecondary": "#60a5fa",
      "accentMuted": "#1d4ed8"
    }
  }
}
```

### Fonts

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `heading` | string | `Inter, system-ui, sans-serif` | Heading font family |
| `body` | string | `Inter, system-ui, sans-serif` | Body text font family |
| `mono` | string | `JetBrains Mono, monospace` | Monospace font family |

**Example: Custom fonts**
```json
{
  "global": {
    "fonts": {
      "heading": "Playfair Display, serif",
      "body": "Open Sans, sans-serif"
    }
  }
}
```

### Timing

All values are in **frames** at 30fps. Multiply seconds by 30 to get frames.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `introFadeIn` | number | `15` | Intro fade in (0.5s) |
| `introHold` | number | `45` | Intro hold (1.5s) |
| `introFadeOut` | number | `15` | Intro fade out (0.5s) |
| `introTotal` | number | `75` | Intro total (2.5s) |
| `bookSlideIn` | number | `12` | Book slide in (0.4s) |
| `bookTitleType` | number | `20` | Title typing (~0.67s) |
| `bookRatingCount` | number | `30` | Rating count-up (1s) |
| `bookHold` | number | `60` | Book hold (2s) |
| `bookExit` | number | `15` | Book exit (0.5s) |
| `bookTotal` | number | `150` | Per-book total (5s) |
| `statsCountUp` | number | `45` | Stats count-up (1.5s) |
| `statsHold` | number | `60` | Stats hold (2s) |
| `statsFadeOut` | number | `15` | Stats fade out (0.5s) |
| `statsTotal` | number | `120` | Stats total (4s) |
| `comingSoonFadeIn` | number | `15` | Coming soon fade in (0.5s) |
| `comingSoonHold` | number | `60` | Coming soon hold (2s) |
| `comingSoonFadeOut` | number | `15` | Coming soon fade out (0.5s) |
| `comingSoonTotal` | number | `90` | Coming soon total (3s) |
| `outroFadeIn` | number | `15` | Outro fade in (0.5s) |
| `outroHold` | number | `60` | Outro hold (2s) |
| `outroFadeOut` | number | `15` | Outro fade out (0.5s) |
| `outroTotal` | number | `90` | Outro total (3s) |
| `transitionOverlap` | number | `6` | Transition overlap (0.2s) |

**Example: Faster pacing**
```json
{
  "global": {
    "timing": {
      "bookTotal": 90,
      "bookHold": 30,
      "statsTotal": 90
    }
  }
}
```

---

## Sequence Configurations

### Intro Sequence

| Property | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| `layout` | string | `centered` | `centered`, `split`, `minimal` | Layout variant |
| `titleFontSize` | number | `72` | - | Month name font size (px) |
| `subtitleFontSize` | number | `36` | - | Year font size (px) |
| `showYear` | boolean | `true` | - | Whether to show the year |

**Layout variants:**
- `centered` - Default centered layout with all elements stacked
- `split` - Header top-left, month centered, book count bottom-right
- `minimal` - Just month and year, no decorative elements

```json
{
  "intro": {
    "layout": "split",
    "titleFontSize": 100,
    "showYear": false
  }
}
```

### Book Reveal Sequence

| Property | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| `layout` | string | `sequential` | `sequential`, `grid`, `carousel` | Layout variant |
| `showRatings` | boolean | `true` | - | Show rating display |
| `showAuthors` | boolean | `true` | - | Show author names |
| `coverSize` | string | `large` | `small`, `medium`, `large` | Book cover size |
| `animationStyle` | string | `slide` | `slide`, `fade`, `pop` | Animation style |

**Layout variants:**
- `sequential` - One book at a time with full reveal animation
- `grid` - All books displayed at once in a grid (shorter duration)
- `carousel` - Books in a carousel/slider format

```json
{
  "bookReveal": {
    "layout": "grid",
    "coverSize": "medium",
    "showAuthors": false
  }
}
```

**Note:** Grid layout affects video duration - all books are shown in a single sequence instead of one per book.

### Stats Reveal Sequence

| Property | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| `layout` | string | `stacked` | `stacked`, `horizontal`, `minimal` | Layout variant |
| `showTotalBooks` | boolean | `true` | - | Show total books stat |
| `showTotalPages` | boolean | `true` | - | Show total pages stat |
| `showAverageRating` | boolean | `true` | - | Show average rating |
| `showTopBook` | boolean | `true` | - | Show top-rated book |
| `animateNumbers` | boolean | `true` | - | Animate number count-up |

```json
{
  "statsReveal": {
    "layout": "horizontal",
    "showTotalPages": false,
    "animateNumbers": false
  }
}
```

### Coming Soon Sequence

| Property | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| `layout` | string | `list` | `list`, `grid`, `single` | Layout variant |
| `showProgress` | boolean | `true` | - | Show reading progress |
| `maxBooks` | number | `3` | - | Maximum books to show |

```json
{
  "comingSoon": {
    "layout": "single",
    "maxBooks": 1
  }
}
```

### Outro Sequence

| Property | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| `layout` | string | `centered` | `centered`, `minimal`, `branded` | Layout variant |
| `showBranding` | boolean | `true` | - | Show Cawpile branding |
| `customText` | string | `""` | - | Custom text to display |

**Layout variants:**
- `centered` - Default with logo, tagline, and website
- `minimal` - Just the logo
- `branded` - Extended branding with larger logo and more elements

```json
{
  "outro": {
    "layout": "branded",
    "customText": "Thanks for watching!"
  }
}
```

---

## Complete Examples

### Minimal Dark Theme

```json
{
  "intro": { "layout": "minimal" },
  "bookReveal": { "layout": "grid", "showAuthors": false },
  "statsReveal": { "layout": "minimal" },
  "outro": { "layout": "minimal" }
}
```

### Light Theme (Custom Colors)

```json
{
  "global": {
    "colors": {
      "background": "#fafafa",
      "backgroundSecondary": "#f4f4f5",
      "backgroundTertiary": "#e4e4e7",
      "textPrimary": "#18181b",
      "textSecondary": "#52525b",
      "textMuted": "#a1a1aa",
      "accent": "#f97316"
    }
  }
}
```

### Fast-Paced Video

```json
{
  "global": {
    "timing": {
      "introTotal": 45,
      "bookTotal": 90,
      "statsTotal": 75,
      "comingSoonTotal": 60,
      "outroTotal": 60
    }
  }
}
```

### Blue Branded Theme

```json
{
  "global": {
    "colors": {
      "accent": "#3b82f6",
      "accentSecondary": "#60a5fa",
      "accentMuted": "#1d4ed8",
      "completed": "#10b981",
      "ratingHigh": "#10b981",
      "ratingMedium": "#f59e0b"
    }
  },
  "intro": {
    "layout": "split",
    "titleFontSize": 96
  },
  "outro": {
    "layout": "branded",
    "customText": "Follow for more book content!"
  }
}
```

---

## Validation Behavior

The template system uses **permissive validation**:

- Unknown properties are silently stripped (not rejected)
- Invalid types are ignored and defaults are used
- Partial templates are merged with defaults
- Empty or null templates use all defaults

This enables forward compatibility - templates with new properties will still work on older versions of the renderer.

In development mode (`NODE_ENV=development`), warnings are logged for stripped properties to aid debugging.
