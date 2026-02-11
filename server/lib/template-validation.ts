/**
 * Template Validation Module
 *
 * Provides permissive validation for VideoTemplate objects.
 * Unknown properties are stripped rather than rejected, supporting forward compatibility.
 */

import {
  getEffectiveTemplate,
  type VideoTemplate,
  type ResolvedVideoTemplate,
} from '../../src/lib/template-types'

// ============================================================================
// Types
// ============================================================================

/**
 * Result of template validation
 */
export interface TemplateValidationResult {
  /** Whether the validation succeeded (always true for permissive validation) */
  valid: boolean
  /** Warnings about stripped or invalid properties */
  warnings: string[]
  /** The sanitized and merged template with all fields populated */
  sanitizedTemplate: ResolvedVideoTemplate
}

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Known property names for each section of the template
 * Used to identify and strip unknown properties
 */
const KNOWN_PROPERTIES = {
  root: ['global', 'intro', 'bookReveal', 'statsReveal', 'comingSoon', 'outro'],
  global: ['colors', 'fonts', 'timing'],
  colors: [
    'background',
    'backgroundSecondary',
    'backgroundTertiary',
    'textPrimary',
    'textSecondary',
    'textMuted',
    'accent',
    'accentSecondary',
    'accentMuted',
    'completed',
    'dnf',
    'ratingHigh',
    'ratingMedium',
    'ratingLow',
    'overlay',
    'grain',
  ],
  fonts: ['heading', 'body', 'mono'],
  timing: [
    'introFadeIn',
    'introHold',
    'introFadeOut',
    'introTotal',
    'bookSlideIn',
    'bookTitleType',
    'bookRatingCount',
    'bookHold',
    'bookExit',
    'bookTotal',
    'statsCountUp',
    'statsHold',
    'statsFadeOut',
    'statsTotal',
    'comingSoonFadeIn',
    'comingSoonHold',
    'comingSoonFadeOut',
    'comingSoonTotal',
    'outroFadeIn',
    'outroHold',
    'outroFadeOut',
    'outroTotal',
    'transitionOverlap',
  ],
  intro: ['layout', 'titleFontSize', 'subtitleFontSize', 'showYear'],
  bookReveal: ['layout', 'showRatings', 'showAuthors', 'coverSize', 'animationStyle'],
  statsReveal: [
    'layout',
    'showTotalBooks',
    'showTotalPages',
    'showAverageRating',
    'showTopBook',
    'animateNumbers',
  ],
  comingSoon: ['layout', 'showProgress', 'maxBooks'],
  outro: ['layout', 'showBranding', 'customText'],
} as const

/**
 * Valid layout values for each sequence
 */
const VALID_LAYOUTS = {
  intro: ['centered', 'split', 'minimal'],
  bookReveal: ['sequential', 'grid', 'carousel'],
  statsReveal: ['stacked', 'horizontal', 'minimal'],
  comingSoon: ['list', 'grid', 'single'],
  outro: ['centered', 'minimal', 'branded'],
} as const

/**
 * Valid cover sizes for book reveal
 */
const VALID_COVER_SIZES = ['small', 'medium', 'large'] as const

/**
 * Valid animation styles for book reveal
 */
const VALID_ANIMATION_STYLES = ['slide', 'fade', 'pop'] as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if running in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Log a warning in development mode
 */
function logWarning(message: string): void {
  if (isDevelopment()) {
    console.warn(`[Template Validation] ${message}`)
  }
}

/**
 * Check if a value is a plain object (not array, null, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  )
}

/**
 * Strip unknown properties from an object based on known property list
 *
 * @param obj - The object to sanitize
 * @param knownProps - Array of known property names
 * @param path - Current path for warning messages
 * @param warnings - Array to collect warning messages
 * @returns Sanitized object with only known properties
 */
function stripUnknownProperties(
  obj: Record<string, unknown>,
  knownProps: readonly string[],
  path: string,
  warnings: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(obj)) {
    if (knownProps.includes(key)) {
      result[key] = obj[key]
    } else {
      const fullPath = path ? `${path}.${key}` : key
      warnings.push(fullPath)
      logWarning(
        `Unknown property "${fullPath}" was stripped. This property is not recognized and will be ignored for forward compatibility.`
      )
    }
  }

  return result
}

/**
 * Validate and sanitize a layout value
 */
function sanitizeLayout(
  value: unknown,
  validValues: readonly string[],
  path: string,
  warnings: string[]
): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'string') {
    warnings.push(`${path} (invalid type: expected string)`)
    logWarning(`Invalid type for "${path}": expected string, got ${typeof value}`)
    return undefined
  }

  if (!validValues.includes(value)) {
    warnings.push(`${path} (invalid value: "${value}")`)
    logWarning(
      `Invalid value for "${path}": "${value}". Valid values are: ${validValues.join(', ')}`
    )
    return undefined
  }

  return value
}

/**
 * Validate that a value is a string
 */
function sanitizeString(
  value: unknown,
  path: string,
  warnings: string[]
): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'string') {
    warnings.push(`${path} (invalid type: expected string)`)
    logWarning(`Invalid type for "${path}": expected string, got ${typeof value}`)
    return undefined
  }

  return value
}

/**
 * Validate that a value is a number
 */
function sanitizeNumber(
  value: unknown,
  path: string,
  warnings: string[]
): number | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'number' || isNaN(value)) {
    warnings.push(`${path} (invalid type: expected number)`)
    logWarning(`Invalid type for "${path}": expected number, got ${typeof value}`)
    return undefined
  }

  return value
}

/**
 * Validate that a value is a boolean
 */
function sanitizeBoolean(
  value: unknown,
  path: string,
  warnings: string[]
): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value !== 'boolean') {
    warnings.push(`${path} (invalid type: expected boolean)`)
    logWarning(`Invalid type for "${path}": expected boolean, got ${typeof value}`)
    return undefined
  }

  return value
}

// ============================================================================
// Section Sanitizers
// ============================================================================

/**
 * Sanitize the colors configuration
 */
function sanitizeColors(
  colors: unknown,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!isPlainObject(colors)) {
    if (colors !== undefined && colors !== null) {
      warnings.push('global.colors (invalid type: expected object)')
      logWarning('Invalid type for "global.colors": expected object')
    }
    return undefined
  }

  const stripped = stripUnknownProperties(
    colors,
    KNOWN_PROPERTIES.colors,
    'global.colors',
    warnings
  )

  const result: Record<string, unknown> = {}

  for (const key of KNOWN_PROPERTIES.colors) {
    const value = stripped[key]
    if (value !== undefined) {
      const sanitized = sanitizeString(value, `global.colors.${key}`, warnings)
      if (sanitized !== undefined) {
        result[key] = sanitized
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Sanitize the fonts configuration
 */
function sanitizeFonts(
  fonts: unknown,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!isPlainObject(fonts)) {
    if (fonts !== undefined && fonts !== null) {
      warnings.push('global.fonts (invalid type: expected object)')
      logWarning('Invalid type for "global.fonts": expected object')
    }
    return undefined
  }

  const stripped = stripUnknownProperties(
    fonts,
    KNOWN_PROPERTIES.fonts,
    'global.fonts',
    warnings
  )

  const result: Record<string, unknown> = {}

  for (const key of KNOWN_PROPERTIES.fonts) {
    const value = stripped[key]
    if (value !== undefined) {
      const sanitized = sanitizeString(value, `global.fonts.${key}`, warnings)
      if (sanitized !== undefined) {
        result[key] = sanitized
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Sanitize the timing configuration
 */
function sanitizeTiming(
  timing: unknown,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!isPlainObject(timing)) {
    if (timing !== undefined && timing !== null) {
      warnings.push('global.timing (invalid type: expected object)')
      logWarning('Invalid type for "global.timing": expected object')
    }
    return undefined
  }

  const stripped = stripUnknownProperties(
    timing,
    KNOWN_PROPERTIES.timing,
    'global.timing',
    warnings
  )

  const result: Record<string, unknown> = {}

  for (const key of KNOWN_PROPERTIES.timing) {
    const value = stripped[key]
    if (value !== undefined) {
      const sanitized = sanitizeNumber(value, `global.timing.${key}`, warnings)
      if (sanitized !== undefined) {
        result[key] = sanitized
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Sanitize the global configuration
 */
function sanitizeGlobal(
  global: unknown,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!isPlainObject(global)) {
    if (global !== undefined && global !== null) {
      warnings.push('global (invalid type: expected object)')
      logWarning('Invalid type for "global": expected object')
    }
    return undefined
  }

  const stripped = stripUnknownProperties(
    global,
    KNOWN_PROPERTIES.global,
    'global',
    warnings
  )

  const result: Record<string, unknown> = {}

  const colors = sanitizeColors(stripped.colors, warnings)
  if (colors) result.colors = colors

  const fonts = sanitizeFonts(stripped.fonts, warnings)
  if (fonts) result.fonts = fonts

  const timing = sanitizeTiming(stripped.timing, warnings)
  if (timing) result.timing = timing

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Sanitize the intro configuration
 */
function sanitizeIntro(
  intro: unknown,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!isPlainObject(intro)) {
    if (intro !== undefined && intro !== null) {
      warnings.push('intro (invalid type: expected object)')
      logWarning('Invalid type for "intro": expected object')
    }
    return undefined
  }

  const stripped = stripUnknownProperties(
    intro,
    KNOWN_PROPERTIES.intro,
    'intro',
    warnings
  )

  const result: Record<string, unknown> = {}

  const layout = sanitizeLayout(
    stripped.layout,
    VALID_LAYOUTS.intro,
    'intro.layout',
    warnings
  )
  if (layout) result.layout = layout

  const titleFontSize = sanitizeNumber(
    stripped.titleFontSize,
    'intro.titleFontSize',
    warnings
  )
  if (titleFontSize !== undefined) result.titleFontSize = titleFontSize

  const subtitleFontSize = sanitizeNumber(
    stripped.subtitleFontSize,
    'intro.subtitleFontSize',
    warnings
  )
  if (subtitleFontSize !== undefined) result.subtitleFontSize = subtitleFontSize

  const showYear = sanitizeBoolean(stripped.showYear, 'intro.showYear', warnings)
  if (showYear !== undefined) result.showYear = showYear

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Sanitize the bookReveal configuration
 */
function sanitizeBookReveal(
  bookReveal: unknown,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!isPlainObject(bookReveal)) {
    if (bookReveal !== undefined && bookReveal !== null) {
      warnings.push('bookReveal (invalid type: expected object)')
      logWarning('Invalid type for "bookReveal": expected object')
    }
    return undefined
  }

  const stripped = stripUnknownProperties(
    bookReveal,
    KNOWN_PROPERTIES.bookReveal,
    'bookReveal',
    warnings
  )

  const result: Record<string, unknown> = {}

  const layout = sanitizeLayout(
    stripped.layout,
    VALID_LAYOUTS.bookReveal,
    'bookReveal.layout',
    warnings
  )
  if (layout) result.layout = layout

  const showRatings = sanitizeBoolean(
    stripped.showRatings,
    'bookReveal.showRatings',
    warnings
  )
  if (showRatings !== undefined) result.showRatings = showRatings

  const showAuthors = sanitizeBoolean(
    stripped.showAuthors,
    'bookReveal.showAuthors',
    warnings
  )
  if (showAuthors !== undefined) result.showAuthors = showAuthors

  const coverSize = sanitizeLayout(
    stripped.coverSize,
    VALID_COVER_SIZES,
    'bookReveal.coverSize',
    warnings
  )
  if (coverSize) result.coverSize = coverSize

  const animationStyle = sanitizeLayout(
    stripped.animationStyle,
    VALID_ANIMATION_STYLES,
    'bookReveal.animationStyle',
    warnings
  )
  if (animationStyle) result.animationStyle = animationStyle

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Sanitize the statsReveal configuration
 */
function sanitizeStatsReveal(
  statsReveal: unknown,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!isPlainObject(statsReveal)) {
    if (statsReveal !== undefined && statsReveal !== null) {
      warnings.push('statsReveal (invalid type: expected object)')
      logWarning('Invalid type for "statsReveal": expected object')
    }
    return undefined
  }

  const stripped = stripUnknownProperties(
    statsReveal,
    KNOWN_PROPERTIES.statsReveal,
    'statsReveal',
    warnings
  )

  const result: Record<string, unknown> = {}

  const layout = sanitizeLayout(
    stripped.layout,
    VALID_LAYOUTS.statsReveal,
    'statsReveal.layout',
    warnings
  )
  if (layout) result.layout = layout

  const showTotalBooks = sanitizeBoolean(
    stripped.showTotalBooks,
    'statsReveal.showTotalBooks',
    warnings
  )
  if (showTotalBooks !== undefined) result.showTotalBooks = showTotalBooks

  const showTotalPages = sanitizeBoolean(
    stripped.showTotalPages,
    'statsReveal.showTotalPages',
    warnings
  )
  if (showTotalPages !== undefined) result.showTotalPages = showTotalPages

  const showAverageRating = sanitizeBoolean(
    stripped.showAverageRating,
    'statsReveal.showAverageRating',
    warnings
  )
  if (showAverageRating !== undefined) result.showAverageRating = showAverageRating

  const showTopBook = sanitizeBoolean(
    stripped.showTopBook,
    'statsReveal.showTopBook',
    warnings
  )
  if (showTopBook !== undefined) result.showTopBook = showTopBook

  const animateNumbers = sanitizeBoolean(
    stripped.animateNumbers,
    'statsReveal.animateNumbers',
    warnings
  )
  if (animateNumbers !== undefined) result.animateNumbers = animateNumbers

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Sanitize the comingSoon configuration
 */
function sanitizeComingSoon(
  comingSoon: unknown,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!isPlainObject(comingSoon)) {
    if (comingSoon !== undefined && comingSoon !== null) {
      warnings.push('comingSoon (invalid type: expected object)')
      logWarning('Invalid type for "comingSoon": expected object')
    }
    return undefined
  }

  const stripped = stripUnknownProperties(
    comingSoon,
    KNOWN_PROPERTIES.comingSoon,
    'comingSoon',
    warnings
  )

  const result: Record<string, unknown> = {}

  const layout = sanitizeLayout(
    stripped.layout,
    VALID_LAYOUTS.comingSoon,
    'comingSoon.layout',
    warnings
  )
  if (layout) result.layout = layout

  const showProgress = sanitizeBoolean(
    stripped.showProgress,
    'comingSoon.showProgress',
    warnings
  )
  if (showProgress !== undefined) result.showProgress = showProgress

  const maxBooks = sanitizeNumber(stripped.maxBooks, 'comingSoon.maxBooks', warnings)
  if (maxBooks !== undefined) result.maxBooks = maxBooks

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Sanitize the outro configuration
 */
function sanitizeOutro(
  outro: unknown,
  warnings: string[]
): Record<string, unknown> | undefined {
  if (!isPlainObject(outro)) {
    if (outro !== undefined && outro !== null) {
      warnings.push('outro (invalid type: expected object)')
      logWarning('Invalid type for "outro": expected object')
    }
    return undefined
  }

  const stripped = stripUnknownProperties(
    outro,
    KNOWN_PROPERTIES.outro,
    'outro',
    warnings
  )

  const result: Record<string, unknown> = {}

  const layout = sanitizeLayout(
    stripped.layout,
    VALID_LAYOUTS.outro,
    'outro.layout',
    warnings
  )
  if (layout) result.layout = layout

  const showBranding = sanitizeBoolean(
    stripped.showBranding,
    'outro.showBranding',
    warnings
  )
  if (showBranding !== undefined) result.showBranding = showBranding

  const customText = sanitizeString(stripped.customText, 'outro.customText', warnings)
  if (customText !== undefined) result.customText = customText

  return Object.keys(result).length > 0 ? result : undefined
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate and sanitize a template object
 *
 * This function performs permissive validation:
 * - Unknown properties are stripped (not rejected)
 * - Invalid types within known properties produce warnings
 * - The result is always a valid, merged template
 *
 * @param template - The input template (can be partial, unknown structure, or null/undefined)
 * @returns TemplateValidationResult with sanitized template and any warnings
 *
 * @example
 * const result = validateTemplate({
 *   global: { colors: { accent: '#ff0000' } },
 *   unknownProperty: 'will be stripped'
 * })
 * // result.valid === true
 * // result.warnings contains 'unknownProperty'
 * // result.sanitizedTemplate has accent override merged with defaults
 */
export function validateTemplate(
  template: unknown
): TemplateValidationResult {
  const warnings: string[] = []

  // Handle null/undefined/empty input
  if (template === null || template === undefined) {
    return {
      valid: true,
      warnings: [],
      sanitizedTemplate: getEffectiveTemplate(),
    }
  }

  // Handle non-object input
  if (!isPlainObject(template)) {
    warnings.push('(root) (invalid type: expected object)')
    logWarning('Invalid template type: expected object, got ' + typeof template)
    return {
      valid: true,
      warnings,
      sanitizedTemplate: getEffectiveTemplate(),
    }
  }

  // Strip unknown top-level properties
  const stripped = stripUnknownProperties(
    template,
    KNOWN_PROPERTIES.root,
    '',
    warnings
  )

  // Build sanitized template
  const sanitized: VideoTemplate = {}

  const global = sanitizeGlobal(stripped.global, warnings)
  if (global) sanitized.global = global as VideoTemplate['global']

  const intro = sanitizeIntro(stripped.intro, warnings)
  if (intro) sanitized.intro = intro as VideoTemplate['intro']

  const bookReveal = sanitizeBookReveal(stripped.bookReveal, warnings)
  if (bookReveal) sanitized.bookReveal = bookReveal as VideoTemplate['bookReveal']

  const statsReveal = sanitizeStatsReveal(stripped.statsReveal, warnings)
  if (statsReveal) sanitized.statsReveal = statsReveal as VideoTemplate['statsReveal']

  const comingSoon = sanitizeComingSoon(stripped.comingSoon, warnings)
  if (comingSoon) sanitized.comingSoon = comingSoon as VideoTemplate['comingSoon']

  const outro = sanitizeOutro(stripped.outro, warnings)
  if (outro) sanitized.outro = outro as VideoTemplate['outro']

  // Merge sanitized template with defaults
  const sanitizedTemplate = getEffectiveTemplate(sanitized)

  return {
    valid: true,
    warnings,
    sanitizedTemplate,
  }
}
