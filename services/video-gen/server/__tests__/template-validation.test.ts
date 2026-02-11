import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateTemplate } from '../lib/template-validation'
import { DEFAULT_TEMPLATE } from '../../src/lib/template-types'

describe('Template Validation', () => {
  describe('validateTemplate', () => {
    // Store original NODE_ENV
    const originalEnv = process.env.NODE_ENV

    beforeEach(() => {
      // Mock console.warn to capture warnings
      vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv
      vi.restoreAllMocks()
    })

    it('should pass valid template through unchanged', () => {
      const validTemplate = {
        global: {
          colors: {
            accent: '#ff0000',
            background: '#000000',
          },
          fonts: {
            heading: 'CustomFont',
          },
          timing: {
            introTotal: 100,
          },
        },
        intro: {
          layout: 'split',
          titleFontSize: 80,
        },
        bookReveal: {
          layout: 'grid',
          showRatings: false,
        },
        statsReveal: {
          layout: 'horizontal',
        },
        comingSoon: {
          layout: 'single',
          maxBooks: 2,
        },
        outro: {
          layout: 'minimal',
          customText: 'Thanks for watching',
        },
      }

      const result = validateTemplate(validTemplate)

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
      // Check that custom values are preserved
      expect(result.sanitizedTemplate.global.colors.accent).toBe('#ff0000')
      expect(result.sanitizedTemplate.global.colors.background).toBe('#000000')
      expect(result.sanitizedTemplate.global.fonts.heading).toBe('CustomFont')
      expect(result.sanitizedTemplate.global.timing.introTotal).toBe(100)
      expect(result.sanitizedTemplate.intro.layout).toBe('split')
      expect(result.sanitizedTemplate.bookReveal.layout).toBe('grid')
      expect(result.sanitizedTemplate.bookReveal.showRatings).toBe(false)
      expect(result.sanitizedTemplate.comingSoon.maxBooks).toBe(2)
      expect(result.sanitizedTemplate.outro.customText).toBe('Thanks for watching')
    })

    it('should strip unknown top-level properties', () => {
      const templateWithUnknown = {
        global: {
          colors: {
            accent: '#ff0000',
          },
        },
        unknownSection: {
          foo: 'bar',
        },
        anotherUnknown: 'value',
      }

      const result = validateTemplate(templateWithUnknown)

      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('unknownSection')
      expect(result.warnings).toContain('anotherUnknown')
      // Valid properties preserved
      expect(result.sanitizedTemplate.global.colors.accent).toBe('#ff0000')
      // Unknown properties not in result
      expect(result.sanitizedTemplate).not.toHaveProperty('unknownSection')
      expect(result.sanitizedTemplate).not.toHaveProperty('anotherUnknown')
    })

    it('should strip unknown nested properties', () => {
      const templateWithNestedUnknown = {
        global: {
          colors: {
            accent: '#ff0000',
            unknownColor: '#123456',
          },
          fonts: {
            heading: 'CustomFont',
            unknownFont: 'BadFont',
          },
          timing: {
            introTotal: 100,
            unknownTiming: 999,
          },
          unknownGlobalSection: 'value',
        },
        intro: {
          layout: 'centered',
          unknownIntroProperty: true,
        },
        bookReveal: {
          layout: 'sequential',
          unknownBookProperty: 'value',
        },
      }

      const result = validateTemplate(templateWithNestedUnknown)

      expect(result.valid).toBe(true)
      // Check warnings contain paths to stripped properties
      expect(result.warnings).toContain('global.unknownGlobalSection')
      expect(result.warnings).toContain('global.colors.unknownColor')
      expect(result.warnings).toContain('global.fonts.unknownFont')
      expect(result.warnings).toContain('global.timing.unknownTiming')
      expect(result.warnings).toContain('intro.unknownIntroProperty')
      expect(result.warnings).toContain('bookReveal.unknownBookProperty')
      // Valid properties preserved
      expect(result.sanitizedTemplate.global.colors.accent).toBe('#ff0000')
      expect(result.sanitizedTemplate.global.fonts.heading).toBe('CustomFont')
      expect(result.sanitizedTemplate.global.timing.introTotal).toBe(100)
    })

    it('should return warnings array with paths of stripped properties', () => {
      const templateWithMultipleUnknown = {
        unknownRoot1: 'value1',
        unknownRoot2: 'value2',
        global: {
          colors: {
            unknownColor1: '#111',
            unknownColor2: '#222',
          },
          unknownGlobal: 'value',
        },
        intro: {
          unknownIntro: 'value',
        },
      }

      const result = validateTemplate(templateWithMultipleUnknown)

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(6)
      expect(result.warnings).toContain('unknownRoot1')
      expect(result.warnings).toContain('unknownRoot2')
      expect(result.warnings).toContain('global.unknownGlobal')
      expect(result.warnings).toContain('global.colors.unknownColor1')
      expect(result.warnings).toContain('global.colors.unknownColor2')
      expect(result.warnings).toContain('intro.unknownIntro')
    })

    it('should accept partial templates and merge with defaults', () => {
      const partialTemplate = {
        global: {
          colors: {
            accent: '#00ff00',
          },
        },
      }

      const result = validateTemplate(partialTemplate)

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
      // Custom value
      expect(result.sanitizedTemplate.global.colors.accent).toBe('#00ff00')
      // Defaults filled in
      expect(result.sanitizedTemplate.global.colors.background).toBe(
        DEFAULT_TEMPLATE.global.colors.background
      )
      expect(result.sanitizedTemplate.global.fonts).toEqual(DEFAULT_TEMPLATE.global.fonts)
      expect(result.sanitizedTemplate.intro).toEqual(DEFAULT_TEMPLATE.intro)
      expect(result.sanitizedTemplate.bookReveal).toEqual(DEFAULT_TEMPLATE.bookReveal)
    })

    it('should return valid result with empty template for null input', () => {
      const result = validateTemplate(null)

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
      expect(result.sanitizedTemplate).toEqual(DEFAULT_TEMPLATE)
    })

    it('should return valid result with empty template for undefined input', () => {
      const result = validateTemplate(undefined)

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
      expect(result.sanitizedTemplate).toEqual(DEFAULT_TEMPLATE)
    })

    it('should return valid result with defaults for empty object input', () => {
      const result = validateTemplate({})

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
      expect(result.sanitizedTemplate).toEqual(DEFAULT_TEMPLATE)
    })

    it('should handle invalid types within known properties', () => {
      const templateWithInvalidTypes = {
        global: {
          colors: {
            accent: 12345, // Should be string
          },
          timing: {
            introTotal: 'not a number', // Should be number
          },
        },
        intro: {
          showYear: 'yes', // Should be boolean
          titleFontSize: 'big', // Should be number
        },
        bookReveal: {
          layout: 'invalid-layout', // Not a valid layout value
        },
      }

      const result = validateTemplate(templateWithInvalidTypes)

      expect(result.valid).toBe(true)
      // Invalid values produce warnings
      expect(result.warnings.some((w) => w.includes('global.colors.accent'))).toBe(true)
      expect(result.warnings.some((w) => w.includes('global.timing.introTotal'))).toBe(
        true
      )
      expect(result.warnings.some((w) => w.includes('intro.showYear'))).toBe(true)
      expect(result.warnings.some((w) => w.includes('intro.titleFontSize'))).toBe(true)
      expect(result.warnings.some((w) => w.includes('bookReveal.layout'))).toBe(true)
      // Invalid values stripped, defaults used
      expect(result.sanitizedTemplate.global.colors.accent).toBe(
        DEFAULT_TEMPLATE.global.colors.accent
      )
      expect(result.sanitizedTemplate.global.timing.introTotal).toBe(
        DEFAULT_TEMPLATE.global.timing.introTotal
      )
      expect(result.sanitizedTemplate.intro.showYear).toBe(DEFAULT_TEMPLATE.intro.showYear)
      expect(result.sanitizedTemplate.bookReveal.layout).toBe(
        DEFAULT_TEMPLATE.bookReveal.layout
      )
    })

    it('should handle non-object input types', () => {
      const result1 = validateTemplate('string')
      const result2 = validateTemplate(123)
      const result3 = validateTemplate([1, 2, 3])
      const result4 = validateTemplate(true)

      // All should return valid with defaults
      expect(result1.valid).toBe(true)
      expect(result1.sanitizedTemplate).toEqual(DEFAULT_TEMPLATE)
      expect(result1.warnings.some((w) => w.includes('invalid type'))).toBe(true)

      expect(result2.valid).toBe(true)
      expect(result2.sanitizedTemplate).toEqual(DEFAULT_TEMPLATE)

      expect(result3.valid).toBe(true)
      expect(result3.sanitizedTemplate).toEqual(DEFAULT_TEMPLATE)

      expect(result4.valid).toBe(true)
      expect(result4.sanitizedTemplate).toEqual(DEFAULT_TEMPLATE)
    })

    it('should validate all sequence layout types correctly', () => {
      // Test valid layouts
      const validLayouts = validateTemplate({
        intro: { layout: 'centered' },
        bookReveal: { layout: 'grid' },
        statsReveal: { layout: 'horizontal' },
        comingSoon: { layout: 'single' },
        outro: { layout: 'branded' },
      })

      expect(validLayouts.valid).toBe(true)
      expect(validLayouts.warnings).toHaveLength(0)
      expect(validLayouts.sanitizedTemplate.intro.layout).toBe('centered')
      expect(validLayouts.sanitizedTemplate.bookReveal.layout).toBe('grid')
      expect(validLayouts.sanitizedTemplate.statsReveal.layout).toBe('horizontal')
      expect(validLayouts.sanitizedTemplate.comingSoon.layout).toBe('single')
      expect(validLayouts.sanitizedTemplate.outro.layout).toBe('branded')

      // Test all intro layouts
      expect(validateTemplate({ intro: { layout: 'split' } }).sanitizedTemplate.intro.layout).toBe('split')
      expect(validateTemplate({ intro: { layout: 'minimal' } }).sanitizedTemplate.intro.layout).toBe('minimal')

      // Test all bookReveal layouts
      expect(validateTemplate({ bookReveal: { layout: 'sequential' } }).sanitizedTemplate.bookReveal.layout).toBe('sequential')
      expect(validateTemplate({ bookReveal: { layout: 'carousel' } }).sanitizedTemplate.bookReveal.layout).toBe('carousel')

      // Test all statsReveal layouts
      expect(validateTemplate({ statsReveal: { layout: 'stacked' } }).sanitizedTemplate.statsReveal.layout).toBe('stacked')
      expect(validateTemplate({ statsReveal: { layout: 'minimal' } }).sanitizedTemplate.statsReveal.layout).toBe('minimal')

      // Test all comingSoon layouts
      expect(validateTemplate({ comingSoon: { layout: 'list' } }).sanitizedTemplate.comingSoon.layout).toBe('list')
      expect(validateTemplate({ comingSoon: { layout: 'grid' } }).sanitizedTemplate.comingSoon.layout).toBe('grid')

      // Test all outro layouts
      expect(validateTemplate({ outro: { layout: 'centered' } }).sanitizedTemplate.outro.layout).toBe('centered')
      expect(validateTemplate({ outro: { layout: 'minimal' } }).sanitizedTemplate.outro.layout).toBe('minimal')
    })

    it('should validate bookReveal specific enums (coverSize, animationStyle)', () => {
      const validEnums = validateTemplate({
        bookReveal: {
          coverSize: 'small',
          animationStyle: 'fade',
        },
      })

      expect(validEnums.valid).toBe(true)
      expect(validEnums.warnings).toHaveLength(0)
      expect(validEnums.sanitizedTemplate.bookReveal.coverSize).toBe('small')
      expect(validEnums.sanitizedTemplate.bookReveal.animationStyle).toBe('fade')

      // Test invalid enums
      const invalidEnums = validateTemplate({
        bookReveal: {
          coverSize: 'huge',
          animationStyle: 'bounce',
        },
      })

      expect(invalidEnums.warnings.some((w) => w.includes('bookReveal.coverSize'))).toBe(
        true
      )
      expect(
        invalidEnums.warnings.some((w) => w.includes('bookReveal.animationStyle'))
      ).toBe(true)
      // Defaults used for invalid values
      expect(invalidEnums.sanitizedTemplate.bookReveal.coverSize).toBe(
        DEFAULT_TEMPLATE.bookReveal.coverSize
      )
      expect(invalidEnums.sanitizedTemplate.bookReveal.animationStyle).toBe(
        DEFAULT_TEMPLATE.bookReveal.animationStyle
      )
    })

    it('should log warnings in development mode', () => {
      process.env.NODE_ENV = 'development'

      validateTemplate({
        unknownProperty: 'value',
        global: {
          colors: {
            unknownColor: '#fff',
          },
        },
      })

      expect(console.warn).toHaveBeenCalled()
      const warnCalls = (console.warn as ReturnType<typeof vi.fn>).mock.calls
      expect(warnCalls.some((call) => call[0].includes('unknownProperty'))).toBe(true)
      expect(warnCalls.some((call) => call[0].includes('unknownColor'))).toBe(true)
    })

    it('should not log warnings in production mode', () => {
      process.env.NODE_ENV = 'production'

      validateTemplate({
        unknownProperty: 'value',
      })

      expect(console.warn).not.toHaveBeenCalled()
    })

    it('should handle deeply nested invalid section types', () => {
      const result = validateTemplate({
        global: 'not an object',
        intro: 123,
        bookReveal: [],
        statsReveal: null,
        comingSoon: true,
        outro: () => {},
      })

      expect(result.valid).toBe(true)
      // All sections should use defaults
      expect(result.sanitizedTemplate).toEqual(DEFAULT_TEMPLATE)
      // Should have warnings for invalid types
      expect(result.warnings.some((w) => w.includes('global'))).toBe(true)
      expect(result.warnings.some((w) => w.includes('intro'))).toBe(true)
      expect(result.warnings.some((w) => w.includes('bookReveal'))).toBe(true)
    })
  })
})
