/**
 * Template Config Validation Utility
 *
 * Strict validation for video template configurations against the schema
 * defined in docs/template-schema.md. Unlike the permissive renderer validation,
 * this utility rejects unknown properties and invalid values.
 */

export interface ValidationError {
  path: string
  message: string
  value: unknown
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// Schema definitions based on docs/template-schema.md

// Valid enum values
const INTRO_LAYOUTS = ['centered', 'split', 'minimal'] as const
const BOOK_REVEAL_LAYOUTS = ['sequential', 'grid', 'carousel'] as const
const STATS_REVEAL_LAYOUTS = ['stacked', 'horizontal', 'minimal'] as const
const COMING_SOON_LAYOUTS = ['list', 'grid', 'single'] as const
const OUTRO_LAYOUTS = ['centered', 'minimal', 'branded'] as const
const COVER_SIZES = ['small', 'medium', 'large'] as const
const ANIMATION_STYLES = ['slide', 'fade', 'pop'] as const

// Valid color property names (16 total from schema)
const COLOR_PROPERTIES = [
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
] as const

// Valid font property names
const FONT_PROPERTIES = ['heading', 'body', 'mono'] as const

// Valid timing property names (20 from schema)
const TIMING_PROPERTIES = [
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
] as const

// Valid top-level properties
const TOP_LEVEL_PROPERTIES = ['global', 'intro', 'bookReveal', 'statsReveal', 'comingSoon', 'outro'] as const

// Valid global sub-properties
const GLOBAL_PROPERTIES = ['colors', 'fonts', 'timing'] as const

// Valid intro properties
const INTRO_PROPERTIES = ['layout', 'titleFontSize', 'subtitleFontSize', 'showYear'] as const

// Valid bookReveal properties
const BOOK_REVEAL_PROPERTIES = ['layout', 'showRatings', 'showAuthors', 'coverSize', 'animationStyle'] as const

// Valid statsReveal properties
const STATS_REVEAL_PROPERTIES = [
  'layout',
  'showTotalBooks',
  'showTotalPages',
  'showAverageRating',
  'showTopBook',
  'animateNumbers',
] as const

// Valid comingSoon properties
const COMING_SOON_PROPERTIES = ['layout', 'showProgress', 'maxBooks'] as const

// Valid outro properties
const OUTRO_PROPERTIES = ['layout', 'showBranding', 'customText'] as const

/**
 * Validates a video template configuration against the schema.
 * Uses strict mode: rejects unknown properties.
 */
export function validateTemplateConfig(config: unknown): ValidationResult {
  const errors: ValidationError[] = []

  // Handle null/undefined/empty configs - these are valid (use defaults)
  if (config === null || config === undefined) {
    return { valid: true, errors: [] }
  }

  if (typeof config !== 'object') {
    errors.push({
      path: '',
      message: 'Config must be an object',
      value: config,
    })
    return { valid: false, errors }
  }

  const configObj = config as Record<string, unknown>

  // Check for unknown top-level properties
  for (const key of Object.keys(configObj)) {
    if (!TOP_LEVEL_PROPERTIES.includes(key as (typeof TOP_LEVEL_PROPERTIES)[number])) {
      errors.push({
        path: key,
        message: `Unknown property "${key}". Valid properties are: ${TOP_LEVEL_PROPERTIES.join(', ')}`,
        value: configObj[key],
      })
    }
  }

  // Validate global config
  if ('global' in configObj && configObj.global !== undefined) {
    validateGlobalConfig(configObj.global, errors)
  }

  // Validate intro config
  if ('intro' in configObj && configObj.intro !== undefined) {
    validateIntroConfig(configObj.intro, errors)
  }

  // Validate bookReveal config
  if ('bookReveal' in configObj && configObj.bookReveal !== undefined) {
    validateBookRevealConfig(configObj.bookReveal, errors)
  }

  // Validate statsReveal config
  if ('statsReveal' in configObj && configObj.statsReveal !== undefined) {
    validateStatsRevealConfig(configObj.statsReveal, errors)
  }

  // Validate comingSoon config
  if ('comingSoon' in configObj && configObj.comingSoon !== undefined) {
    validateComingSoonConfig(configObj.comingSoon, errors)
  }

  // Validate outro config
  if ('outro' in configObj && configObj.outro !== undefined) {
    validateOutroConfig(configObj.outro, errors)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

function validateGlobalConfig(global: unknown, errors: ValidationError[]): void {
  if (typeof global !== 'object' || global === null) {
    errors.push({
      path: 'global',
      message: 'global must be an object',
      value: global,
    })
    return
  }

  const globalObj = global as Record<string, unknown>

  // Check for unknown global properties
  for (const key of Object.keys(globalObj)) {
    if (!GLOBAL_PROPERTIES.includes(key as (typeof GLOBAL_PROPERTIES)[number])) {
      errors.push({
        path: `global.${key}`,
        message: `Unknown property "global.${key}". Valid properties are: ${GLOBAL_PROPERTIES.join(', ')}`,
        value: globalObj[key],
      })
    }
  }

  // Validate colors
  if ('colors' in globalObj && globalObj.colors !== undefined) {
    validateColorsConfig(globalObj.colors, errors)
  }

  // Validate fonts
  if ('fonts' in globalObj && globalObj.fonts !== undefined) {
    validateFontsConfig(globalObj.fonts, errors)
  }

  // Validate timing
  if ('timing' in globalObj && globalObj.timing !== undefined) {
    validateTimingConfig(globalObj.timing, errors)
  }
}

function validateColorsConfig(colors: unknown, errors: ValidationError[]): void {
  if (typeof colors !== 'object' || colors === null) {
    errors.push({
      path: 'global.colors',
      message: 'global.colors must be an object',
      value: colors,
    })
    return
  }

  const colorsObj = colors as Record<string, unknown>

  for (const key of Object.keys(colorsObj)) {
    const path = `global.colors.${key}`

    // Check for unknown color properties
    if (!COLOR_PROPERTIES.includes(key as (typeof COLOR_PROPERTIES)[number])) {
      errors.push({
        path,
        message: `Unknown color property "${key}". Valid properties are: ${COLOR_PROPERTIES.join(', ')}`,
        value: colorsObj[key],
      })
      continue
    }

    // All color values must be strings
    if (typeof colorsObj[key] !== 'string') {
      errors.push({
        path,
        message: `Color "${key}" must be a string`,
        value: colorsObj[key],
      })
    }
  }
}

function validateFontsConfig(fonts: unknown, errors: ValidationError[]): void {
  if (typeof fonts !== 'object' || fonts === null) {
    errors.push({
      path: 'global.fonts',
      message: 'global.fonts must be an object',
      value: fonts,
    })
    return
  }

  const fontsObj = fonts as Record<string, unknown>

  for (const key of Object.keys(fontsObj)) {
    const path = `global.fonts.${key}`

    // Check for unknown font properties
    if (!FONT_PROPERTIES.includes(key as (typeof FONT_PROPERTIES)[number])) {
      errors.push({
        path,
        message: `Unknown font property "${key}". Valid properties are: ${FONT_PROPERTIES.join(', ')}`,
        value: fontsObj[key],
      })
      continue
    }

    // All font values must be strings
    if (typeof fontsObj[key] !== 'string') {
      errors.push({
        path,
        message: `Font "${key}" must be a string`,
        value: fontsObj[key],
      })
    }
  }
}

function validateTimingConfig(timing: unknown, errors: ValidationError[]): void {
  if (typeof timing !== 'object' || timing === null) {
    errors.push({
      path: 'global.timing',
      message: 'global.timing must be an object',
      value: timing,
    })
    return
  }

  const timingObj = timing as Record<string, unknown>

  for (const key of Object.keys(timingObj)) {
    const path = `global.timing.${key}`

    // Check for unknown timing properties
    if (!TIMING_PROPERTIES.includes(key as (typeof TIMING_PROPERTIES)[number])) {
      errors.push({
        path,
        message: `Unknown timing property "${key}". Valid properties are: ${TIMING_PROPERTIES.join(', ')}`,
        value: timingObj[key],
      })
      continue
    }

    // All timing values must be numbers
    if (typeof timingObj[key] !== 'number') {
      errors.push({
        path,
        message: `Timing "${key}" must be a number`,
        value: timingObj[key],
      })
    }
  }
}

function validateIntroConfig(intro: unknown, errors: ValidationError[]): void {
  if (typeof intro !== 'object' || intro === null) {
    errors.push({
      path: 'intro',
      message: 'intro must be an object',
      value: intro,
    })
    return
  }

  const introObj = intro as Record<string, unknown>

  // Check for unknown intro properties
  for (const key of Object.keys(introObj)) {
    if (!INTRO_PROPERTIES.includes(key as (typeof INTRO_PROPERTIES)[number])) {
      errors.push({
        path: `intro.${key}`,
        message: `Unknown property "intro.${key}". Valid properties are: ${INTRO_PROPERTIES.join(', ')}`,
        value: introObj[key],
      })
    }
  }

  // Validate layout enum
  if ('layout' in introObj && introObj.layout !== undefined) {
    if (!INTRO_LAYOUTS.includes(introObj.layout as (typeof INTRO_LAYOUTS)[number])) {
      errors.push({
        path: 'intro.layout',
        message: `Invalid layout value. Must be one of: ${INTRO_LAYOUTS.join(', ')}`,
        value: introObj.layout,
      })
    }
  }

  // Validate titleFontSize (number)
  if ('titleFontSize' in introObj && introObj.titleFontSize !== undefined) {
    if (typeof introObj.titleFontSize !== 'number') {
      errors.push({
        path: 'intro.titleFontSize',
        message: 'titleFontSize must be a number',
        value: introObj.titleFontSize,
      })
    }
  }

  // Validate subtitleFontSize (number)
  if ('subtitleFontSize' in introObj && introObj.subtitleFontSize !== undefined) {
    if (typeof introObj.subtitleFontSize !== 'number') {
      errors.push({
        path: 'intro.subtitleFontSize',
        message: 'subtitleFontSize must be a number',
        value: introObj.subtitleFontSize,
      })
    }
  }

  // Validate showYear (boolean)
  if ('showYear' in introObj && introObj.showYear !== undefined) {
    if (typeof introObj.showYear !== 'boolean') {
      errors.push({
        path: 'intro.showYear',
        message: 'showYear must be a boolean',
        value: introObj.showYear,
      })
    }
  }
}

function validateBookRevealConfig(bookReveal: unknown, errors: ValidationError[]): void {
  if (typeof bookReveal !== 'object' || bookReveal === null) {
    errors.push({
      path: 'bookReveal',
      message: 'bookReveal must be an object',
      value: bookReveal,
    })
    return
  }

  const bookRevealObj = bookReveal as Record<string, unknown>

  // Check for unknown bookReveal properties
  for (const key of Object.keys(bookRevealObj)) {
    if (!BOOK_REVEAL_PROPERTIES.includes(key as (typeof BOOK_REVEAL_PROPERTIES)[number])) {
      errors.push({
        path: `bookReveal.${key}`,
        message: `Unknown property "bookReveal.${key}". Valid properties are: ${BOOK_REVEAL_PROPERTIES.join(', ')}`,
        value: bookRevealObj[key],
      })
    }
  }

  // Validate layout enum
  if ('layout' in bookRevealObj && bookRevealObj.layout !== undefined) {
    if (!BOOK_REVEAL_LAYOUTS.includes(bookRevealObj.layout as (typeof BOOK_REVEAL_LAYOUTS)[number])) {
      errors.push({
        path: 'bookReveal.layout',
        message: `Invalid layout value. Must be one of: ${BOOK_REVEAL_LAYOUTS.join(', ')}`,
        value: bookRevealObj.layout,
      })
    }
  }

  // Validate coverSize enum
  if ('coverSize' in bookRevealObj && bookRevealObj.coverSize !== undefined) {
    if (!COVER_SIZES.includes(bookRevealObj.coverSize as (typeof COVER_SIZES)[number])) {
      errors.push({
        path: 'bookReveal.coverSize',
        message: `Invalid coverSize value. Must be one of: ${COVER_SIZES.join(', ')}`,
        value: bookRevealObj.coverSize,
      })
    }
  }

  // Validate animationStyle enum
  if ('animationStyle' in bookRevealObj && bookRevealObj.animationStyle !== undefined) {
    if (!ANIMATION_STYLES.includes(bookRevealObj.animationStyle as (typeof ANIMATION_STYLES)[number])) {
      errors.push({
        path: 'bookReveal.animationStyle',
        message: `Invalid animationStyle value. Must be one of: ${ANIMATION_STYLES.join(', ')}`,
        value: bookRevealObj.animationStyle,
      })
    }
  }

  // Validate boolean fields
  const booleanFields = ['showRatings', 'showAuthors'] as const
  for (const field of booleanFields) {
    if (field in bookRevealObj && bookRevealObj[field] !== undefined) {
      if (typeof bookRevealObj[field] !== 'boolean') {
        errors.push({
          path: `bookReveal.${field}`,
          message: `${field} must be a boolean`,
          value: bookRevealObj[field],
        })
      }
    }
  }
}

function validateStatsRevealConfig(statsReveal: unknown, errors: ValidationError[]): void {
  if (typeof statsReveal !== 'object' || statsReveal === null) {
    errors.push({
      path: 'statsReveal',
      message: 'statsReveal must be an object',
      value: statsReveal,
    })
    return
  }

  const statsRevealObj = statsReveal as Record<string, unknown>

  // Check for unknown statsReveal properties
  for (const key of Object.keys(statsRevealObj)) {
    if (!STATS_REVEAL_PROPERTIES.includes(key as (typeof STATS_REVEAL_PROPERTIES)[number])) {
      errors.push({
        path: `statsReveal.${key}`,
        message: `Unknown property "statsReveal.${key}". Valid properties are: ${STATS_REVEAL_PROPERTIES.join(', ')}`,
        value: statsRevealObj[key],
      })
    }
  }

  // Validate layout enum
  if ('layout' in statsRevealObj && statsRevealObj.layout !== undefined) {
    if (!STATS_REVEAL_LAYOUTS.includes(statsRevealObj.layout as (typeof STATS_REVEAL_LAYOUTS)[number])) {
      errors.push({
        path: 'statsReveal.layout',
        message: `Invalid layout value. Must be one of: ${STATS_REVEAL_LAYOUTS.join(', ')}`,
        value: statsRevealObj.layout,
      })
    }
  }

  // Validate boolean fields
  const booleanFields = ['showTotalBooks', 'showTotalPages', 'showAverageRating', 'showTopBook', 'animateNumbers'] as const
  for (const field of booleanFields) {
    if (field in statsRevealObj && statsRevealObj[field] !== undefined) {
      if (typeof statsRevealObj[field] !== 'boolean') {
        errors.push({
          path: `statsReveal.${field}`,
          message: `${field} must be a boolean`,
          value: statsRevealObj[field],
        })
      }
    }
  }
}

function validateComingSoonConfig(comingSoon: unknown, errors: ValidationError[]): void {
  if (typeof comingSoon !== 'object' || comingSoon === null) {
    errors.push({
      path: 'comingSoon',
      message: 'comingSoon must be an object',
      value: comingSoon,
    })
    return
  }

  const comingSoonObj = comingSoon as Record<string, unknown>

  // Check for unknown comingSoon properties
  for (const key of Object.keys(comingSoonObj)) {
    if (!COMING_SOON_PROPERTIES.includes(key as (typeof COMING_SOON_PROPERTIES)[number])) {
      errors.push({
        path: `comingSoon.${key}`,
        message: `Unknown property "comingSoon.${key}". Valid properties are: ${COMING_SOON_PROPERTIES.join(', ')}`,
        value: comingSoonObj[key],
      })
    }
  }

  // Validate layout enum
  if ('layout' in comingSoonObj && comingSoonObj.layout !== undefined) {
    if (!COMING_SOON_LAYOUTS.includes(comingSoonObj.layout as (typeof COMING_SOON_LAYOUTS)[number])) {
      errors.push({
        path: 'comingSoon.layout',
        message: `Invalid layout value. Must be one of: ${COMING_SOON_LAYOUTS.join(', ')}`,
        value: comingSoonObj.layout,
      })
    }
  }

  // Validate showProgress (boolean)
  if ('showProgress' in comingSoonObj && comingSoonObj.showProgress !== undefined) {
    if (typeof comingSoonObj.showProgress !== 'boolean') {
      errors.push({
        path: 'comingSoon.showProgress',
        message: 'showProgress must be a boolean',
        value: comingSoonObj.showProgress,
      })
    }
  }

  // Validate maxBooks (number)
  if ('maxBooks' in comingSoonObj && comingSoonObj.maxBooks !== undefined) {
    if (typeof comingSoonObj.maxBooks !== 'number') {
      errors.push({
        path: 'comingSoon.maxBooks',
        message: 'maxBooks must be a number',
        value: comingSoonObj.maxBooks,
      })
    }
  }
}

function validateOutroConfig(outro: unknown, errors: ValidationError[]): void {
  if (typeof outro !== 'object' || outro === null) {
    errors.push({
      path: 'outro',
      message: 'outro must be an object',
      value: outro,
    })
    return
  }

  const outroObj = outro as Record<string, unknown>

  // Check for unknown outro properties
  for (const key of Object.keys(outroObj)) {
    if (!OUTRO_PROPERTIES.includes(key as (typeof OUTRO_PROPERTIES)[number])) {
      errors.push({
        path: `outro.${key}`,
        message: `Unknown property "outro.${key}". Valid properties are: ${OUTRO_PROPERTIES.join(', ')}`,
        value: outroObj[key],
      })
    }
  }

  // Validate layout enum
  if ('layout' in outroObj && outroObj.layout !== undefined) {
    if (!OUTRO_LAYOUTS.includes(outroObj.layout as (typeof OUTRO_LAYOUTS)[number])) {
      errors.push({
        path: 'outro.layout',
        message: `Invalid layout value. Must be one of: ${OUTRO_LAYOUTS.join(', ')}`,
        value: outroObj.layout,
      })
    }
  }

  // Validate showBranding (boolean)
  if ('showBranding' in outroObj && outroObj.showBranding !== undefined) {
    if (typeof outroObj.showBranding !== 'boolean') {
      errors.push({
        path: 'outro.showBranding',
        message: 'showBranding must be a boolean',
        value: outroObj.showBranding,
      })
    }
  }

  // Validate customText (string)
  if ('customText' in outroObj && outroObj.customText !== undefined) {
    if (typeof outroObj.customText !== 'string') {
      errors.push({
        path: 'outro.customText',
        message: 'customText must be a string',
        value: outroObj.customText,
      })
    }
  }
}
