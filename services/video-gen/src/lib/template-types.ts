/**
 * Template System Type Definitions
 *
 * Defines the VideoTemplate interface and related types for customizing
 * video styles, layouts, and animations at render time via inline JSON.
 *
 * SYNC NOTE: This file is the canonical source for template types.
 * A duplicate copy exists in the main Next.js app at src/types/video-template.ts
 * When modifying types here, ensure the main app copy is updated as well.
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
  // Background image
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
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
  // Background image
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
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
  // Background image
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
}

/**
 * Configuration for the ComingSoonSequence
 */
export interface ComingSoonConfig {
  layout?: ComingSoonLayout
  // Additional styling options
  showProgress?: boolean
  maxBooks?: number
  // Background image
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
}

/**
 * Configuration for the OutroSequence
 */
export interface OutroConfig {
  layout?: OutroLayout
  // Additional styling options
  showBranding?: boolean
  customText?: string
  // Background image
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
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
  // Background image (applies to all sequences as default)
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
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
  backgroundImage: string | null
  backgroundOverlayOpacity: number
}

/**
 * Fully resolved intro config with all fields populated
 */
export interface ResolvedIntroConfig {
  layout: IntroLayout
  titleFontSize: number
  subtitleFontSize: number
  showYear: boolean
  backgroundImage: string | null
  backgroundOverlayOpacity: number
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
  backgroundImage: string | null
  backgroundOverlayOpacity: number
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
  backgroundImage: string | null
  backgroundOverlayOpacity: number
}

/**
 * Fully resolved coming soon config with all fields populated
 */
export interface ResolvedComingSoonConfig {
  layout: ComingSoonLayout
  showProgress: boolean
  maxBooks: number
  backgroundImage: string | null
  backgroundOverlayOpacity: number
}

/**
 * Fully resolved outro config with all fields populated
 */
export interface ResolvedOutroConfig {
  layout: OutroLayout
  showBranding: boolean
  customText: string
  backgroundImage: string | null
  backgroundOverlayOpacity: number
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
    backgroundImage: null,
    backgroundOverlayOpacity: 0.7,
  },
  intro: {
    layout: 'centered',
    titleFontSize: 72,
    subtitleFontSize: 36,
    showYear: true,
    backgroundImage: null,
    backgroundOverlayOpacity: null as unknown as number,
  },
  bookReveal: {
    layout: 'sequential',
    showRatings: true,
    showAuthors: true,
    coverSize: 'large',
    animationStyle: 'slide',
    backgroundImage: null,
    backgroundOverlayOpacity: null as unknown as number,
  },
  statsReveal: {
    layout: 'stacked',
    showTotalBooks: true,
    showTotalPages: true,
    showAverageRating: true,
    showTopBook: true,
    animateNumbers: true,
    backgroundImage: null,
    backgroundOverlayOpacity: null as unknown as number,
  },
  comingSoon: {
    layout: 'list',
    showProgress: true,
    maxBooks: 3,
    backgroundImage: null,
    backgroundOverlayOpacity: null as unknown as number,
  },
  outro: {
    layout: 'centered',
    showBranding: true,
    customText: '',
    backgroundImage: null,
    backgroundOverlayOpacity: null as unknown as number,
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
 * Sequence names for iteration in background image resolution
 */
const SEQUENCE_NAMES = ['intro', 'bookReveal', 'statsReveal', 'comingSoon', 'outro'] as const

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
    return {
      ...DEFAULT_TEMPLATE,
      // Apply global fallback to sequences for the default template
      intro: { ...DEFAULT_TEMPLATE.intro, backgroundImage: DEFAULT_TEMPLATE.global.backgroundImage, backgroundOverlayOpacity: DEFAULT_TEMPLATE.global.backgroundOverlayOpacity },
      bookReveal: { ...DEFAULT_TEMPLATE.bookReveal, backgroundImage: DEFAULT_TEMPLATE.global.backgroundImage, backgroundOverlayOpacity: DEFAULT_TEMPLATE.global.backgroundOverlayOpacity },
      statsReveal: { ...DEFAULT_TEMPLATE.statsReveal, backgroundImage: DEFAULT_TEMPLATE.global.backgroundImage, backgroundOverlayOpacity: DEFAULT_TEMPLATE.global.backgroundOverlayOpacity },
      comingSoon: { ...DEFAULT_TEMPLATE.comingSoon, backgroundImage: DEFAULT_TEMPLATE.global.backgroundImage, backgroundOverlayOpacity: DEFAULT_TEMPLATE.global.backgroundOverlayOpacity },
      outro: { ...DEFAULT_TEMPLATE.outro, backgroundImage: DEFAULT_TEMPLATE.global.backgroundImage, backgroundOverlayOpacity: DEFAULT_TEMPLATE.global.backgroundOverlayOpacity },
    }
  }

  // Step 1: Deep merge with defaults
  const globalColors = deepMerge(DEFAULT_TEMPLATE.global.colors, template.global?.colors)
  const globalFonts = deepMerge(DEFAULT_TEMPLATE.global.fonts, template.global?.fonts)
  const globalTiming = deepMerge(DEFAULT_TEMPLATE.global.timing, template.global?.timing)

  // Resolve global background image fields
  const globalBackgroundImage = template.global?.backgroundImage !== undefined && template.global?.backgroundImage !== null
    ? template.global.backgroundImage
    : DEFAULT_TEMPLATE.global.backgroundImage
  const globalBackgroundOverlayOpacity = template.global?.backgroundOverlayOpacity !== undefined && template.global?.backgroundOverlayOpacity !== null
    ? template.global.backgroundOverlayOpacity
    : DEFAULT_TEMPLATE.global.backgroundOverlayOpacity

  const resolved: ResolvedVideoTemplate = {
    global: {
      colors: globalColors,
      fonts: globalFonts,
      timing: globalTiming,
      backgroundImage: globalBackgroundImage,
      backgroundOverlayOpacity: globalBackgroundOverlayOpacity,
    },
    intro: deepMerge(DEFAULT_TEMPLATE.intro, template.intro as Partial<ResolvedIntroConfig>),
    bookReveal: deepMerge(DEFAULT_TEMPLATE.bookReveal, template.bookReveal as Partial<ResolvedBookRevealConfig>),
    statsReveal: deepMerge(DEFAULT_TEMPLATE.statsReveal, template.statsReveal as Partial<ResolvedStatsRevealConfig>),
    comingSoon: deepMerge(DEFAULT_TEMPLATE.comingSoon, template.comingSoon as Partial<ResolvedComingSoonConfig>),
    outro: deepMerge(DEFAULT_TEMPLATE.outro, template.outro as Partial<ResolvedOutroConfig>),
  }

  // Step 2: Post-processing - apply global-to-sequence fallback for background image fields
  for (const seqName of SEQUENCE_NAMES) {
    const seqConfig = resolved[seqName] as unknown as Record<string, unknown>
    const sourceSeqConfig = template[seqName] as Record<string, unknown> | undefined

    // For backgroundImage: if the source sequence explicitly sets it (even to a string),
    // use that value. Otherwise, inherit from global.
    // deepMerge skips null values, so sequence-level null means "inherit from global"
    if (sourceSeqConfig?.backgroundImage !== undefined && sourceSeqConfig.backgroundImage !== null) {
      seqConfig.backgroundImage = sourceSeqConfig.backgroundImage
    } else {
      seqConfig.backgroundImage = globalBackgroundImage
    }

    // For backgroundOverlayOpacity: same fallback logic
    if (sourceSeqConfig?.backgroundOverlayOpacity !== undefined && sourceSeqConfig.backgroundOverlayOpacity !== null) {
      seqConfig.backgroundOverlayOpacity = sourceSeqConfig.backgroundOverlayOpacity
    } else {
      seqConfig.backgroundOverlayOpacity = globalBackgroundOverlayOpacity
    }
  }

  return resolved
}
