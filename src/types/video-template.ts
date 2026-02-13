/**
 * Video Template Type Definitions (Main App Copy)
 *
 * SYNC NOTE: This file is a duplicate of the canonical types in
 * services/video-gen/src/lib/template-types.ts
 * When modifying types here, ensure the video-gen copy is updated as well.
 * The DEFAULT_TEMPLATE values are hardcoded from services/video-gen/src/lib/theme.ts
 */

// ============================================================================
// Layout Type Unions
// ============================================================================

export type IntroLayout = 'centered' | 'split' | 'minimal'
export type BookRevealLayout = 'sequential' | 'grid' | 'carousel'
export type StatsRevealLayout = 'stacked' | 'horizontal' | 'minimal'
export type ComingSoonLayout = 'list' | 'grid' | 'single'
export type OutroLayout = 'centered' | 'minimal' | 'branded'

// ============================================================================
// Color Configuration
// ============================================================================

export interface ColorsConfig {
  background?: string
  backgroundSecondary?: string
  backgroundTertiary?: string
  textPrimary?: string
  textSecondary?: string
  textMuted?: string
  accent?: string
  accentSecondary?: string
  accentMuted?: string
  completed?: string
  dnf?: string
  ratingHigh?: string
  ratingMedium?: string
  ratingLow?: string
  overlay?: string
  grain?: string
}

// ============================================================================
// Font Configuration
// ============================================================================

export interface FontsConfig {
  heading?: string
  body?: string
  mono?: string
}

// ============================================================================
// Timing Configuration
// ============================================================================

export interface TimingConfig {
  introFadeIn?: number
  introHold?: number
  introFadeOut?: number
  introTotal?: number
  bookSlideIn?: number
  bookTitleType?: number
  bookRatingCount?: number
  bookHold?: number
  bookExit?: number
  bookTotal?: number
  statsCountUp?: number
  statsHold?: number
  statsFadeOut?: number
  statsTotal?: number
  comingSoonFadeIn?: number
  comingSoonHold?: number
  comingSoonFadeOut?: number
  comingSoonTotal?: number
  outroFadeIn?: number
  outroHold?: number
  outroFadeOut?: number
  outroTotal?: number
  transitionOverlap?: number
}

// ============================================================================
// Sequence Configuration Interfaces
// ============================================================================

export interface IntroConfig {
  layout?: IntroLayout
  titleFontSize?: number
  subtitleFontSize?: number
  showYear?: boolean
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
}

export interface BookRevealConfig {
  layout?: BookRevealLayout
  showRatings?: boolean
  showAuthors?: boolean
  coverSize?: 'small' | 'medium' | 'large'
  animationStyle?: 'slide' | 'fade' | 'pop'
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
}

export interface StatsRevealConfig {
  layout?: StatsRevealLayout
  showTotalBooks?: boolean
  showTotalPages?: boolean
  showAverageRating?: boolean
  showTopBook?: boolean
  animateNumbers?: boolean
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
}

export interface ComingSoonConfig {
  layout?: ComingSoonLayout
  showProgress?: boolean
  maxBooks?: number
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
}

export interface OutroConfig {
  layout?: OutroLayout
  showBranding?: boolean
  customText?: string
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
}

// ============================================================================
// Global Template Configuration
// ============================================================================

export interface GlobalTemplateConfig {
  colors?: ColorsConfig
  fonts?: FontsConfig
  timing?: TimingConfig
  backgroundImage?: string | null
  backgroundOverlayOpacity?: number | null
}

// ============================================================================
// Main VideoTemplate Interface
// ============================================================================

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

export type ResolvedColorsConfig = Required<ColorsConfig>
export type ResolvedFontsConfig = Required<FontsConfig>
export type ResolvedTimingConfig = Required<TimingConfig>

export interface ResolvedGlobalConfig {
  colors: ResolvedColorsConfig
  fonts: ResolvedFontsConfig
  timing: ResolvedTimingConfig
  backgroundImage: string | null
  backgroundOverlayOpacity: number
}

export interface ResolvedIntroConfig {
  layout: IntroLayout
  titleFontSize: number
  subtitleFontSize: number
  showYear: boolean
  backgroundImage: string | null
  backgroundOverlayOpacity: number
}

export interface ResolvedBookRevealConfig {
  layout: BookRevealLayout
  showRatings: boolean
  showAuthors: boolean
  coverSize: 'small' | 'medium' | 'large'
  animationStyle: 'slide' | 'fade' | 'pop'
  backgroundImage: string | null
  backgroundOverlayOpacity: number
}

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

export interface ResolvedComingSoonConfig {
  layout: ComingSoonLayout
  showProgress: boolean
  maxBooks: number
  backgroundImage: string | null
  backgroundOverlayOpacity: number
}

export interface ResolvedOutroConfig {
  layout: OutroLayout
  showBranding: boolean
  customText: string
  backgroundImage: string | null
  backgroundOverlayOpacity: number
}

export interface ResolvedVideoTemplate {
  global: ResolvedGlobalConfig
  intro: ResolvedIntroConfig
  bookReveal: ResolvedBookRevealConfig
  statsReveal: ResolvedStatsRevealConfig
  comingSoon: ResolvedComingSoonConfig
  outro: ResolvedOutroConfig
}

// ============================================================================
// Default Template (hardcoded values from services/video-gen/src/lib/theme.ts)
// ============================================================================

export const DEFAULT_TEMPLATE: ResolvedVideoTemplate = {
  global: {
    colors: {
      background: '#0a0a0a',
      backgroundSecondary: '#111111',
      backgroundTertiary: '#1a1a1a',
      textPrimary: '#ffffff',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
      accent: '#f97316',
      accentSecondary: '#fb923c',
      accentMuted: '#c2410c',
      completed: '#22c55e',
      dnf: '#ef4444',
      ratingHigh: '#22c55e',
      ratingMedium: '#eab308',
      ratingLow: '#ef4444',
      overlay: 'rgba(0, 0, 0, 0.7)',
      grain: 'rgba(255, 255, 255, 0.02)',
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    timing: {
      introFadeIn: 15,
      introHold: 45,
      introFadeOut: 15,
      introTotal: 75,
      bookSlideIn: 12,
      bookTitleType: 20,
      bookRatingCount: 30,
      bookHold: 60,
      bookExit: 15,
      bookTotal: 150,
      statsCountUp: 45,
      statsHold: 60,
      statsFadeOut: 15,
      statsTotal: 120,
      comingSoonFadeIn: 15,
      comingSoonHold: 60,
      comingSoonFadeOut: 15,
      comingSoonTotal: 90,
      outroFadeIn: 15,
      outroHold: 60,
      outroFadeOut: 15,
      outroTotal: 90,
      transitionOverlap: 6,
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
