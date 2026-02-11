/**
 * Template System Type Definitions
 *
 * Defines the VideoTemplate interface and related types for customizing
 * video styles, layouts, and animations at render time via inline JSON.
 */

import { COLORS, FONTS, TIMING } from './theme'

// ============================================================================
// Layout Type Unions
// ============================================================================

/**
 * Layout options for the IntroSequence
 * - centered: Current default with centered text
 * - split: Text split across screen areas
 * - minimal: Reduced visual elements
 */
export type IntroLayout = 'centered' | 'split' | 'minimal'

/**
 * Layout options for BookReveal sequence
 * - sequential: Current default showing one book at a time
 * - grid: All book covers displayed at once in a grid
 * - carousel: Books shown in a carousel/slider format
 */
export type BookRevealLayout = 'sequential' | 'grid' | 'carousel'

/**
 * Layout options for StatsReveal sequence
 * - stacked: Current default with stacked stat cards
 * - horizontal: Stats displayed in horizontal arrangement
 * - minimal: Simplified stats display
 */
export type StatsRevealLayout = 'stacked' | 'horizontal' | 'minimal'

/**
 * Layout options for ComingSoonSequence
 * - list: Current default showing list of upcoming books
 * - grid: Books displayed in a grid format
 * - single: Focus on a single upcoming book
 */
export type ComingSoonLayout = 'list' | 'grid' | 'single'

/**
 * Layout options for OutroSequence
 * - centered: Current default with centered branding
 * - minimal: Simplified outro
 * - branded: Extended branding elements
 */
export type OutroLayout = 'centered' | 'minimal' | 'branded'

// ============================================================================
// Color Configuration
// ============================================================================

/**
 * Color configuration matching the COLORS constant structure in theme.ts
 */
export interface ColorsConfig {
  // Background colors
  background?: string
  backgroundSecondary?: string
  backgroundTertiary?: string

  // Text colors
  textPrimary?: string
  textSecondary?: string
  textMuted?: string

  // Accent colors
  accent?: string
  accentSecondary?: string
  accentMuted?: string

  // Status colors
  completed?: string
  dnf?: string

  // Rating colors
  ratingHigh?: string
  ratingMedium?: string
  ratingLow?: string

  // Overlay/effects
  overlay?: string
  grain?: string
}

// ============================================================================
// Font Configuration
// ============================================================================

/**
 * Font configuration matching the FONTS constant structure in theme.ts
 */
export interface FontsConfig {
  heading?: string
  body?: string
  mono?: string
}

// ============================================================================
// Timing Configuration
// ============================================================================

/**
 * Timing configuration matching the TIMING constant structure in theme.ts
 * All values are in frames (at 30fps)
 */
export interface TimingConfig {
  // Intro sequence
  introFadeIn?: number
  introHold?: number
  introFadeOut?: number
  introTotal?: number

  // Per book reveal
  bookSlideIn?: number
  bookTitleType?: number
  bookRatingCount?: number
  bookHold?: number
  bookExit?: number
  bookTotal?: number

  // Stats reveal
  statsCountUp?: number
  statsHold?: number
  statsFadeOut?: number
  statsTotal?: number

  // Coming soon
  comingSoonFadeIn?: number
  comingSoonHold?: number
  comingSoonFadeOut?: number
  comingSoonTotal?: number

  // Outro
  outroFadeIn?: number
  outroHold?: number
  outroFadeOut?: number
  outroTotal?: number

  // Transitions
  transitionOverlap?: number
}

// ============================================================================
// Sequence Configuration Interfaces
// ============================================================================

/**
 * Configuration for the IntroSequence
 */
export interface IntroConfig {
  layout?: IntroLayout
  // Additional styling options
  titleFontSize?: number
  subtitleFontSize?: number
  showYear?: boolean
}

/**
 * Configuration for the BookReveal sequence
 */
export interface BookRevealConfig {
  layout?: BookRevealLayout
  // Additional styling options
  showRatings?: boolean
  showAuthors?: boolean
  coverSize?: 'small' | 'medium' | 'large'
  animationStyle?: 'slide' | 'fade' | 'pop'
}

/**
 * Configuration for the StatsReveal sequence
 */
export interface StatsRevealConfig {
  layout?: StatsRevealLayout
  // Additional styling options
  showTotalBooks?: boolean
  showTotalPages?: boolean
  showAverageRating?: boolean
  showTopBook?: boolean
  animateNumbers?: boolean
}

/**
 * Configuration for the ComingSoonSequence
 */
export interface ComingSoonConfig {
  layout?: ComingSoonLayout
  // Additional styling options
  showProgress?: boolean
  maxBooks?: number
}

/**
 * Configuration for the OutroSequence
 */
export interface OutroConfig {
  layout?: OutroLayout
  // Additional styling options
  showBranding?: boolean
  customText?: string
}

// ============================================================================
// Global Template Configuration
// ============================================================================

/**
 * Global styling configuration that applies across all sequences
 */
export interface GlobalTemplateConfig {
  colors?: ColorsConfig
  fonts?: FontsConfig
  timing?: TimingConfig
}

// ============================================================================
// Main VideoTemplate Interface
// ============================================================================

/**
 * Main template interface composing all sequence configs and global config
 * All properties are optional to support partial template overrides
 */
export interface VideoTemplate {
  global?: GlobalTemplateConfig
  intro?: IntroConfig
  bookReveal?: BookRevealConfig
  statsReveal?: StatsRevealConfig
  comingSoon?: ComingSoonConfig
  outro?: OutroConfig
}

// ============================================================================
// Resolved Template Types (with all fields populated)
// ============================================================================

/**
 * Fully resolved colors with all fields populated
 */
export type ResolvedColorsConfig = Required<ColorsConfig>

/**
 * Fully resolved fonts with all fields populated
 */
export type ResolvedFontsConfig = Required<FontsConfig>

/**
 * Fully resolved timing with all fields populated
 */
export type ResolvedTimingConfig = Required<TimingConfig>

/**
 * Fully resolved global config with all fields populated
 */
export interface ResolvedGlobalConfig {
  colors: ResolvedColorsConfig
  fonts: ResolvedFontsConfig
  timing: ResolvedTimingConfig
}

/**
 * Fully resolved intro config with all fields populated
 */
export interface ResolvedIntroConfig {
  layout: IntroLayout
  titleFontSize: number
  subtitleFontSize: number
  showYear: boolean
}

/**
 * Fully resolved book reveal config with all fields populated
 */
export interface ResolvedBookRevealConfig {
  layout: BookRevealLayout
  showRatings: boolean
  showAuthors: boolean
  coverSize: 'small' | 'medium' | 'large'
  animationStyle: 'slide' | 'fade' | 'pop'
}

/**
 * Fully resolved stats reveal config with all fields populated
 */
export interface ResolvedStatsRevealConfig {
  layout: StatsRevealLayout
  showTotalBooks: boolean
  showTotalPages: boolean
  showAverageRating: boolean
  showTopBook: boolean
  animateNumbers: boolean
}

/**
 * Fully resolved coming soon config with all fields populated
 */
export interface ResolvedComingSoonConfig {
  layout: ComingSoonLayout
  showProgress: boolean
  maxBooks: number
}

/**
 * Fully resolved outro config with all fields populated
 */
export interface ResolvedOutroConfig {
  layout: OutroLayout
  showBranding: boolean
  customText: string
}

/**
 * Fully resolved VideoTemplate with all fields populated
 * This is what components receive after merging with defaults
 */
export interface ResolvedVideoTemplate {
  global: ResolvedGlobalConfig
  intro: ResolvedIntroConfig
  bookReveal: ResolvedBookRevealConfig
  statsReveal: ResolvedStatsRevealConfig
  comingSoon: ResolvedComingSoonConfig
  outro: ResolvedOutroConfig
}

// ============================================================================
// Default Template
// ============================================================================

/**
 * Default template values derived from current theme.ts constants
 * When no template is provided, this produces identical behavior to current implementation
 */
export const DEFAULT_TEMPLATE: ResolvedVideoTemplate = {
  global: {
    colors: {
      background: COLORS.background,
      backgroundSecondary: COLORS.backgroundSecondary,
      backgroundTertiary: COLORS.backgroundTertiary,
      textPrimary: COLORS.textPrimary,
      textSecondary: COLORS.textSecondary,
      textMuted: COLORS.textMuted,
      accent: COLORS.accent,
      accentSecondary: COLORS.accentSecondary,
      accentMuted: COLORS.accentMuted,
      completed: COLORS.completed,
      dnf: COLORS.dnf,
      ratingHigh: COLORS.ratingHigh,
      ratingMedium: COLORS.ratingMedium,
      ratingLow: COLORS.ratingLow,
      overlay: COLORS.overlay,
      grain: COLORS.grain,
    },
    fonts: {
      heading: FONTS.heading,
      body: FONTS.body,
      mono: FONTS.mono,
    },
    timing: {
      introFadeIn: TIMING.introFadeIn,
      introHold: TIMING.introHold,
      introFadeOut: TIMING.introFadeOut,
      introTotal: TIMING.introTotal,
      bookSlideIn: TIMING.bookSlideIn,
      bookTitleType: TIMING.bookTitleType,
      bookRatingCount: TIMING.bookRatingCount,
      bookHold: TIMING.bookHold,
      bookExit: TIMING.bookExit,
      bookTotal: TIMING.bookTotal,
      statsCountUp: TIMING.statsCountUp,
      statsHold: TIMING.statsHold,
      statsFadeOut: TIMING.statsFadeOut,
      statsTotal: TIMING.statsTotal,
      comingSoonFadeIn: TIMING.comingSoonFadeIn,
      comingSoonHold: TIMING.comingSoonHold,
      comingSoonFadeOut: TIMING.comingSoonFadeOut,
      comingSoonTotal: TIMING.comingSoonTotal,
      outroFadeIn: TIMING.outroFadeIn,
      outroHold: TIMING.outroHold,
      outroFadeOut: TIMING.outroFadeOut,
      outroTotal: TIMING.outroTotal,
      transitionOverlap: TIMING.transitionOverlap,
    },
  },
  intro: {
    layout: 'centered',
    titleFontSize: 72,
    subtitleFontSize: 36,
    showYear: true,
  },
  bookReveal: {
    layout: 'sequential',
    showRatings: true,
    showAuthors: true,
    coverSize: 'large',
    animationStyle: 'slide',
  },
  statsReveal: {
    layout: 'stacked',
    showTotalBooks: true,
    showTotalPages: true,
    showAverageRating: true,
    showTopBook: true,
    animateNumbers: true,
  },
  comingSoon: {
    layout: 'list',
    showProgress: true,
    maxBooks: 3,
  },
  outro: {
    layout: 'centered',
    showBranding: true,
    customText: '',
  },
}

// ============================================================================
// Template Merging Utility
// ============================================================================

/**
 * Deep merge utility for objects
 * Handles nested objects while preserving non-object values
 */
function deepMerge<T extends object>(target: T, source: Partial<T> | undefined): T {
  if (!source) {
    return target
  }

  const result = { ...target } as T

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key]
    const targetValue = target[key]

    // Skip undefined and null values from source
    if (sourceValue === undefined || sourceValue === null) {
      continue
    }

    // If both values are objects (but not arrays), deep merge
    if (
      typeof sourceValue === 'object' &&
      typeof targetValue === 'object' &&
      !Array.isArray(sourceValue) &&
      !Array.isArray(targetValue) &&
      sourceValue !== null &&
      targetValue !== null
    ) {
      result[key] = deepMerge(
        targetValue as object,
        sourceValue as Partial<typeof targetValue>
      ) as T[keyof T]
    } else {
      // Otherwise, use the source value
      result[key] = sourceValue as T[keyof T]
    }
  }

  return result
}

/**
 * Get an effective template by merging provided partial template over defaults
 *
 * @param template - Optional partial template with overrides
 * @returns Complete ResolvedVideoTemplate with all fields populated
 *
 * @example
 * // Get default template
 * const template = getEffectiveTemplate()
 *
 * @example
 * // Override just colors
 * const template = getEffectiveTemplate({
 *   global: { colors: { accent: '#ff0000' } }
 * })
 *
 * @example
 * // Override layout for book reveal
 * const template = getEffectiveTemplate({
 *   bookReveal: { layout: 'grid' }
 * })
 */
export function getEffectiveTemplate(
  template?: Partial<VideoTemplate> | null
): ResolvedVideoTemplate {
  if (!template) {
    return DEFAULT_TEMPLATE
  }

  return {
    global: {
      colors: deepMerge(DEFAULT_TEMPLATE.global.colors, template.global?.colors),
      fonts: deepMerge(DEFAULT_TEMPLATE.global.fonts, template.global?.fonts),
      timing: deepMerge(DEFAULT_TEMPLATE.global.timing, template.global?.timing),
    },
    intro: deepMerge(DEFAULT_TEMPLATE.intro, template.intro),
    bookReveal: deepMerge(DEFAULT_TEMPLATE.bookReveal, template.bookReveal),
    statsReveal: deepMerge(DEFAULT_TEMPLATE.statsReveal, template.statsReveal),
    comingSoon: deepMerge(DEFAULT_TEMPLATE.comingSoon, template.comingSoon),
    outro: deepMerge(DEFAULT_TEMPLATE.outro, template.outro),
  }
}
