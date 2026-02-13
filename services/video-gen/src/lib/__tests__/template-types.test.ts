import { describe, it, expect } from 'vitest'
import {
  getEffectiveTemplate,
  DEFAULT_TEMPLATE,
  type VideoTemplate,
} from '../template-types'
import { COLORS, FONTS, TIMING } from '../theme'

/**
 * Helper: build the expected resolved default template
 * getEffectiveTemplate() applies global-to-sequence fallback for background fields,
 * so the resolved template differs from DEFAULT_TEMPLATE for sequence backgroundOverlayOpacity.
 */
function expectedResolvedDefault() {
  return {
    ...DEFAULT_TEMPLATE,
    intro: { ...DEFAULT_TEMPLATE.intro, backgroundImage: null, backgroundOverlayOpacity: 0.7 },
    bookReveal: { ...DEFAULT_TEMPLATE.bookReveal, backgroundImage: null, backgroundOverlayOpacity: 0.7 },
    statsReveal: { ...DEFAULT_TEMPLATE.statsReveal, backgroundImage: null, backgroundOverlayOpacity: 0.7 },
    comingSoon: { ...DEFAULT_TEMPLATE.comingSoon, backgroundImage: null, backgroundOverlayOpacity: 0.7 },
    outro: { ...DEFAULT_TEMPLATE.outro, backgroundImage: null, backgroundOverlayOpacity: 0.7 },
  }
}

describe('Template Types', () => {
  describe('DEFAULT_TEMPLATE', () => {
    it('should match current theme values for colors', () => {
      expect(DEFAULT_TEMPLATE.global.colors.background).toBe(COLORS.background)
      expect(DEFAULT_TEMPLATE.global.colors.accent).toBe(COLORS.accent)
      expect(DEFAULT_TEMPLATE.global.colors.textPrimary).toBe(COLORS.textPrimary)
      expect(DEFAULT_TEMPLATE.global.colors.ratingHigh).toBe(COLORS.ratingHigh)
    })

    it('should match current theme values for fonts', () => {
      expect(DEFAULT_TEMPLATE.global.fonts.heading).toBe(FONTS.heading)
      expect(DEFAULT_TEMPLATE.global.fonts.body).toBe(FONTS.body)
      expect(DEFAULT_TEMPLATE.global.fonts.mono).toBe(FONTS.mono)
    })

    it('should match current theme values for timing', () => {
      expect(DEFAULT_TEMPLATE.global.timing.introTotal).toBe(TIMING.introTotal)
      expect(DEFAULT_TEMPLATE.global.timing.bookTotal).toBe(TIMING.bookTotal)
      expect(DEFAULT_TEMPLATE.global.timing.transitionOverlap).toBe(
        TIMING.transitionOverlap
      )
    })

    it('should have default layout values for all sequences', () => {
      expect(DEFAULT_TEMPLATE.intro.layout).toBe('centered')
      expect(DEFAULT_TEMPLATE.bookReveal.layout).toBe('sequential')
      expect(DEFAULT_TEMPLATE.statsReveal.layout).toBe('stacked')
      expect(DEFAULT_TEMPLATE.comingSoon.layout).toBe('list')
      expect(DEFAULT_TEMPLATE.outro.layout).toBe('centered')
    })

    it('should have background image defaults', () => {
      expect(DEFAULT_TEMPLATE.global.backgroundImage).toBe(null)
      expect(DEFAULT_TEMPLATE.global.backgroundOverlayOpacity).toBe(0.7)
      // Sequence-level defaults are null (inherit from global)
      expect(DEFAULT_TEMPLATE.intro.backgroundImage).toBe(null)
      expect(DEFAULT_TEMPLATE.bookReveal.backgroundImage).toBe(null)
    })
  })

  describe('getEffectiveTemplate', () => {
    it('should return resolved defaults when no input provided', () => {
      const result = getEffectiveTemplate()
      expect(result).toEqual(expectedResolvedDefault())
    })

    it('should return resolved defaults when null is provided', () => {
      const result = getEffectiveTemplate(null)
      expect(result).toEqual(expectedResolvedDefault())
    })

    it('should return resolved defaults when undefined is provided', () => {
      const result = getEffectiveTemplate(undefined)
      expect(result).toEqual(expectedResolvedDefault())
    })

    it('should return resolved defaults when empty object is provided', () => {
      const result = getEffectiveTemplate({})
      expect(result).toEqual(expectedResolvedDefault())
    })

    it('should preserve other defaults when only colors are overridden', () => {
      const partialTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#ff0000',
          },
        },
      }

      const result = getEffectiveTemplate(partialTemplate)

      // Overridden value
      expect(result.global.colors.accent).toBe('#ff0000')
      // Preserved defaults in same section
      expect(result.global.colors.background).toBe(COLORS.background)
      expect(result.global.colors.textPrimary).toBe(COLORS.textPrimary)
      // Preserved defaults in other global sections
      expect(result.global.fonts).toEqual(DEFAULT_TEMPLATE.global.fonts)
      expect(result.global.timing).toEqual(DEFAULT_TEMPLATE.global.timing)
      // Preserved defaults in sequence configs (layout etc)
      expect(result.intro.layout).toEqual(DEFAULT_TEMPLATE.intro.layout)
      expect(result.bookReveal.layout).toEqual(DEFAULT_TEMPLATE.bookReveal.layout)
    })

    it('should deep merge nested properties (e.g., bookReveal.layout)', () => {
      const partialTemplate: Partial<VideoTemplate> = {
        bookReveal: {
          layout: 'grid',
        },
      }

      const result = getEffectiveTemplate(partialTemplate)

      // Overridden value
      expect(result.bookReveal.layout).toBe('grid')
      // Preserved sibling properties in bookReveal
      expect(result.bookReveal.showRatings).toBe(
        DEFAULT_TEMPLATE.bookReveal.showRatings
      )
      expect(result.bookReveal.showAuthors).toBe(
        DEFAULT_TEMPLATE.bookReveal.showAuthors
      )
      expect(result.bookReveal.coverSize).toBe(DEFAULT_TEMPLATE.bookReveal.coverSize)
      expect(result.bookReveal.animationStyle).toBe(
        DEFAULT_TEMPLATE.bookReveal.animationStyle
      )
      // Preserved other sections
      expect(result.intro.layout).toEqual(DEFAULT_TEMPLATE.intro.layout)
      expect(result.global.colors).toEqual(DEFAULT_TEMPLATE.global.colors)
    })

    it('should handle deeply nested partial overrides (e.g., only global.colors.accent)', () => {
      const partialTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#00ff00',
            ratingHigh: '#0000ff',
          },
        },
      }

      const result = getEffectiveTemplate(partialTemplate)

      // Overridden values
      expect(result.global.colors.accent).toBe('#00ff00')
      expect(result.global.colors.ratingHigh).toBe('#0000ff')
      // All other colors preserved
      expect(result.global.colors.background).toBe(COLORS.background)
      expect(result.global.colors.textPrimary).toBe(COLORS.textPrimary)
      expect(result.global.colors.ratingMedium).toBe(COLORS.ratingMedium)
      expect(result.global.colors.ratingLow).toBe(COLORS.ratingLow)
    })

    it('should not corrupt merged result when null values are in partial template', () => {
      const partialTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#ff0000',
            // @ts-expect-error - Testing null handling
            background: null,
          },
        },
        // @ts-expect-error - Testing null handling
        intro: null,
      }

      const result = getEffectiveTemplate(partialTemplate)

      // Null value should be ignored, default preserved
      expect(result.global.colors.background).toBe(COLORS.background)
      // Overridden value should work
      expect(result.global.colors.accent).toBe('#ff0000')
      // Null section should use defaults
      expect(result.intro.layout).toEqual(DEFAULT_TEMPLATE.intro.layout)
    })

    it('should not corrupt merged result when undefined values are in partial template', () => {
      const partialTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#ff0000',
            background: undefined,
          },
        },
        intro: undefined,
      }

      const result = getEffectiveTemplate(partialTemplate)

      // Undefined value should be ignored, default preserved
      expect(result.global.colors.background).toBe(COLORS.background)
      // Overridden value should work
      expect(result.global.colors.accent).toBe('#ff0000')
      // Undefined section should use defaults
      expect(result.intro.layout).toEqual(DEFAULT_TEMPLATE.intro.layout)
    })

    it('should allow complete template to pass through unchanged', () => {
      const completeTemplate: VideoTemplate = {
        global: {
          colors: {
            background: '#111111',
            backgroundSecondary: '#222222',
            backgroundTertiary: '#333333',
            textPrimary: '#ffffff',
            textSecondary: '#cccccc',
            textMuted: '#999999',
            accent: '#ff0000',
            accentSecondary: '#ff3333',
            accentMuted: '#cc0000',
            completed: '#00ff00',
            dnf: '#ff0000',
            ratingHigh: '#00ff00',
            ratingMedium: '#ffff00',
            ratingLow: '#ff0000',
            overlay: 'rgba(0,0,0,0.5)',
            grain: 'rgba(255,255,255,0.01)',
          },
          fonts: {
            heading: 'CustomFont',
            body: 'CustomBody',
            mono: 'CustomMono',
          },
          timing: {
            introFadeIn: 10,
            introHold: 30,
            introFadeOut: 10,
            introTotal: 50,
            bookSlideIn: 10,
            bookTitleType: 15,
            bookRatingCount: 20,
            bookHold: 40,
            bookExit: 10,
            bookTotal: 100,
            statsCountUp: 30,
            statsHold: 40,
            statsFadeOut: 10,
            statsTotal: 80,
            comingSoonFadeIn: 10,
            comingSoonHold: 40,
            comingSoonFadeOut: 10,
            comingSoonTotal: 60,
            outroFadeIn: 10,
            outroHold: 40,
            outroFadeOut: 10,
            outroTotal: 60,
            transitionOverlap: 5,
          },
        },
        intro: {
          layout: 'split',
          titleFontSize: 80,
          subtitleFontSize: 40,
          showYear: false,
        },
        bookReveal: {
          layout: 'grid',
          showRatings: false,
          showAuthors: false,
          coverSize: 'small',
          animationStyle: 'fade',
        },
        statsReveal: {
          layout: 'horizontal',
          showTotalBooks: false,
          showTotalPages: false,
          showAverageRating: true,
          showTopBook: false,
          animateNumbers: false,
        },
        comingSoon: {
          layout: 'single',
          showProgress: false,
          maxBooks: 1,
        },
        outro: {
          layout: 'minimal',
          showBranding: false,
          customText: 'Custom outro text',
        },
      }

      const result = getEffectiveTemplate(completeTemplate)

      // Verify all custom values are preserved
      expect(result.global.colors.accent).toBe('#ff0000')
      expect(result.global.fonts.heading).toBe('CustomFont')
      expect(result.global.timing.introTotal).toBe(50)
      expect(result.intro.layout).toBe('split')
      expect(result.intro.showYear).toBe(false)
      expect(result.bookReveal.layout).toBe('grid')
      expect(result.statsReveal.layout).toBe('horizontal')
      expect(result.comingSoon.maxBooks).toBe(1)
      expect(result.outro.customText).toBe('Custom outro text')
    })

    it('should handle partial timing overrides while preserving others', () => {
      const partialTemplate: Partial<VideoTemplate> = {
        global: {
          timing: {
            introTotal: 100,
            bookTotal: 200,
          },
        },
      }

      const result = getEffectiveTemplate(partialTemplate)

      // Overridden values
      expect(result.global.timing.introTotal).toBe(100)
      expect(result.global.timing.bookTotal).toBe(200)
      // Preserved values
      expect(result.global.timing.introFadeIn).toBe(TIMING.introFadeIn)
      expect(result.global.timing.statsTotal).toBe(TIMING.statsTotal)
      expect(result.global.timing.transitionOverlap).toBe(TIMING.transitionOverlap)
    })
  })

  // ============================================================================
  // Background Image Tests (Task Group 1)
  // ============================================================================

  describe('getEffectiveTemplate background image resolution', () => {
    it('should resolve backgroundImage and backgroundOverlayOpacity from global defaults when no overrides are set', () => {
      const result = getEffectiveTemplate({
        global: {
          backgroundImage: 'https://example.com/bg.jpg',
          backgroundOverlayOpacity: 0.5,
        },
      })

      // Global values set
      expect(result.global.backgroundImage).toBe('https://example.com/bg.jpg')
      expect(result.global.backgroundOverlayOpacity).toBe(0.5)

      // All sequences inherit from global
      expect(result.intro.backgroundImage).toBe('https://example.com/bg.jpg')
      expect(result.intro.backgroundOverlayOpacity).toBe(0.5)
      expect(result.bookReveal.backgroundImage).toBe('https://example.com/bg.jpg')
      expect(result.bookReveal.backgroundOverlayOpacity).toBe(0.5)
      expect(result.statsReveal.backgroundImage).toBe('https://example.com/bg.jpg')
      expect(result.statsReveal.backgroundOverlayOpacity).toBe(0.5)
      expect(result.comingSoon.backgroundImage).toBe('https://example.com/bg.jpg')
      expect(result.comingSoon.backgroundOverlayOpacity).toBe(0.5)
      expect(result.outro.backgroundImage).toBe('https://example.com/bg.jpg')
      expect(result.outro.backgroundOverlayOpacity).toBe(0.5)
    })

    it('should apply per-sequence backgroundImage override while others inherit global', () => {
      const result = getEffectiveTemplate({
        global: {
          backgroundImage: 'https://example.com/global-bg.jpg',
          backgroundOverlayOpacity: 0.6,
        },
        intro: {
          backgroundImage: 'https://example.com/intro-bg.jpg',
        },
      })

      // Intro has its own override
      expect(result.intro.backgroundImage).toBe('https://example.com/intro-bg.jpg')
      // Intro inherits opacity from global (no override set)
      expect(result.intro.backgroundOverlayOpacity).toBe(0.6)

      // Other sequences inherit global
      expect(result.bookReveal.backgroundImage).toBe('https://example.com/global-bg.jpg')
      expect(result.statsReveal.backgroundImage).toBe('https://example.com/global-bg.jpg')
      expect(result.comingSoon.backgroundImage).toBe('https://example.com/global-bg.jpg')
      expect(result.outro.backgroundImage).toBe('https://example.com/global-bg.jpg')
    })

    it('should apply per-sequence backgroundOverlayOpacity override', () => {
      const result = getEffectiveTemplate({
        global: {
          backgroundImage: 'https://example.com/bg.jpg',
          backgroundOverlayOpacity: 0.7,
        },
        bookReveal: {
          backgroundOverlayOpacity: 0.3,
        },
      })

      // bookReveal has its own opacity
      expect(result.bookReveal.backgroundOverlayOpacity).toBe(0.3)
      // bookReveal inherits image from global
      expect(result.bookReveal.backgroundImage).toBe('https://example.com/bg.jpg')

      // Other sequences inherit global opacity
      expect(result.intro.backgroundOverlayOpacity).toBe(0.7)
      expect(result.statsReveal.backgroundOverlayOpacity).toBe(0.7)
    })
  })
})
