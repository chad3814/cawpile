/**
 * Image theme constants for shareable review image generation.
 * These values are used for consistent styling in the ReviewImageTemplate.
 */

// Image dimensions for Instagram Stories / TikTok (9:16 aspect ratio)
export const IMAGE_WIDTH = 1080
export const IMAGE_HEIGHT = 1920

// Colors (matching app's dark theme)
export const BG_COLOR = '#0f172a'  // slate-900
export const TEXT_COLOR = '#ffffff'
export const TEXT_MUTED_COLOR = '#94a3b8'  // slate-400
export const ACCENT_COLOR = '#f97316'  // orange-500
export const BORDER_COLOR = '#334155'  // slate-700

// Score-based colors (inline hex values for html2canvas compatibility)
export const SCORE_COLORS = {
  excellent: '#22c55e',  // green-500
  good: '#eab308',       // yellow-500
  average: '#f97316',    // orange-500
  poor: '#ef4444',       // red-500
}

/**
 * Returns the appropriate color for a CAWPILE score value.
 * Uses hex values directly for html2canvas compatibility.
 */
export function getScoreColor(value: number): string {
  if (value >= 8) return SCORE_COLORS.excellent
  if (value >= 6) return SCORE_COLORS.good
  if (value >= 4) return SCORE_COLORS.average
  return SCORE_COLORS.poor
}

// Typography sizes (in pixels for inline styles)
export const TYPOGRAPHY = {
  title: {
    fontSize: 48,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  author: {
    fontSize: 28,
    fontWeight: 400,
    lineHeight: 1.4,
  },
  facetName: {
    fontSize: 22,
    fontWeight: 500,
    lineHeight: 1.3,
  },
  facetScore: {
    fontSize: 26,
    fontWeight: 700,
    lineHeight: 1,
  },
  average: {
    fontSize: 56,
    fontWeight: 700,
    lineHeight: 1,
  },
  stars: {
    fontSize: 32,
    lineHeight: 1,
  },
  review: {
    fontSize: 24,
    fontWeight: 400,
    lineHeight: 1.6,
  },
  metadata: {
    fontSize: 20,
    fontWeight: 400,
    lineHeight: 1.4,
  },
  branding: {
    fontSize: 18,
    fontWeight: 500,
    lineHeight: 1,
  },
}

// Spacing (in pixels)
export const SPACING = {
  padding: 48,
  sectionGap: 32,
  itemGap: 16,
  smallGap: 8,
}

// Cover image dimensions
export const COVER_SIZE = {
  width: 280,
  height: 420,  // 2:3 aspect ratio
}

// Maximum characters for review text before truncation
export const MAX_REVIEW_CHARS = 500
