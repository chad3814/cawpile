/**
 * Theme configuration for video generation
 * Dark, moody aesthetic with bold typography
 */

export const VIDEO_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const

export const COLORS = {
  // Background colors
  background: '#0a0a0a',
  backgroundSecondary: '#111111',
  backgroundTertiary: '#1a1a1a',

  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',

  // Accent colors
  accent: '#f97316', // Orange (Cawpile brand)
  accentSecondary: '#fb923c',
  accentMuted: '#c2410c',

  // Status colors
  completed: '#22c55e',
  dnf: '#ef4444',

  // Rating colors
  ratingHigh: '#22c55e', // 8-10
  ratingMedium: '#eab308', // 5-7
  ratingLow: '#ef4444', // 1-4

  // Overlay/effects
  overlay: 'rgba(0, 0, 0, 0.7)',
  grain: 'rgba(255, 255, 255, 0.02)',
} as const

export const FONTS = {
  heading: 'Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, sans-serif',
  mono: 'JetBrains Mono, monospace',
} as const

// Timing in frames (at 30fps)
export const TIMING = {
  // Intro sequence
  introFadeIn: 15, // 0.5s
  introHold: 45, // 1.5s
  introFadeOut: 15, // 0.5s
  introTotal: 75, // 2.5s

  // Per book reveal
  bookSlideIn: 12, // 0.4s
  bookTitleType: 20, // ~0.67s
  bookRatingCount: 30, // 1s
  bookHold: 60, // 2s hold after fully revealed
  bookExit: 15, // 0.5s exit animation
  bookTotal: 150, // 5s total

  // Stats reveal
  statsCountUp: 45, // 1.5s
  statsHold: 60, // 2s
  statsFadeOut: 15, // 0.5s
  statsTotal: 120, // 4s

  // Coming soon
  comingSoonFadeIn: 15, // 0.5s
  comingSoonHold: 60, // 2s
  comingSoonFadeOut: 15, // 0.5s
  comingSoonTotal: 90, // 3s

  // Outro
  outroFadeIn: 15, // 0.5s
  outroHold: 60, // 2s
  outroFadeOut: 15, // 0.5s
  outroTotal: 90, // 3s

  // Transitions
  transitionOverlap: 6, // 0.2s overlap between sequences
} as const

export function getRatingColor(rating: number): string {
  if (rating >= 8) return COLORS.ratingHigh
  if (rating >= 5) return COLORS.ratingMedium
  return COLORS.ratingLow
}

export function convertToStars(average: number): number {
  if (average <= 1.0) return 0
  if (average <= 2.2) return 1
  if (average <= 4.5) return 2
  if (average <= 6.9) return 3
  if (average <= 8.9) return 4
  return 5
}
