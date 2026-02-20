/**
 * @jest-environment node
 */
import { validateTemplateConfig } from '@/lib/video/validateTemplateConfig'

describe('validateTemplateConfig', () => {
  describe('valid configurations', () => {
    test('should pass validation for a complete valid template', () => {
      const config = {
        global: {
          colors: {
            background: '#0a0a0a',
            accent: '#f97316',
            textPrimary: '#ffffff',
          },
          fonts: {
            heading: 'Inter, system-ui, sans-serif',
            body: 'Inter, system-ui, sans-serif',
          },
          timing: {
            introTotal: 75,
            bookTotal: 150,
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
          customText: 'Thanks for watching!',
        },
      }

      const result = validateTemplateConfig(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should pass validation for a partial template (all fields optional)', () => {
      const config = {
        intro: {
          layout: 'minimal',
        },
        bookReveal: {
          coverSize: 'medium',
        },
      }

      const result = validateTemplateConfig(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should pass validation for empty config (uses defaults)', () => {
      const result1 = validateTemplateConfig({})
      expect(result1.valid).toBe(true)
      expect(result1.errors).toHaveLength(0)

      const result2 = validateTemplateConfig(null)
      expect(result2.valid).toBe(true)
      expect(result2.errors).toHaveLength(0)

      const result3 = validateTemplateConfig(undefined)
      expect(result3.valid).toBe(true)
      expect(result3.errors).toHaveLength(0)
    })
  })

  describe('strict mode - unknown properties rejection', () => {
    test('should reject unknown top-level properties', () => {
      const config = {
        global: {
          colors: { accent: '#f97316' },
        },
        unknownProperty: 'value',
        anotherUnknown: { nested: 'value' },
      }

      const result = validateTemplateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(1)
      expect(result.errors.some((e) => e.path === 'unknownProperty')).toBe(true)
      expect(result.errors.some((e) => e.path === 'anotherUnknown')).toBe(true)
    })

    test('should reject unknown nested properties (e.g., unknown color key)', () => {
      const config = {
        global: {
          colors: {
            accent: '#f97316',
            unknownColor: '#000000',
          },
        },
      }

      const result = validateTemplateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(1)
      expect(result.errors.some((e) => e.path === 'global.colors.unknownColor')).toBe(true)
    })
  })

  describe('invalid enum values', () => {
    test('should reject invalid enum values for layout fields', () => {
      const config = {
        intro: {
          layout: 'invalid-layout',
        },
        bookReveal: {
          layout: 'wrong',
          coverSize: 'extra-large',
          animationStyle: 'bounce',
        },
        statsReveal: {
          layout: 'vertical',
        },
        comingSoon: {
          layout: 'carousel',
        },
        outro: {
          layout: 'fancy',
        },
      }

      const result = validateTemplateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(6)

      // Check for specific invalid enum errors
      expect(result.errors.some((e) => e.path === 'intro.layout')).toBe(true)
      expect(result.errors.some((e) => e.path === 'bookReveal.layout')).toBe(true)
      expect(result.errors.some((e) => e.path === 'bookReveal.coverSize')).toBe(true)
      expect(result.errors.some((e) => e.path === 'bookReveal.animationStyle')).toBe(true)
    })
  })

  describe('invalid types', () => {
    test('should reject invalid types (e.g., string instead of number)', () => {
      const config = {
        intro: {
          titleFontSize: 'large', // should be number
          subtitleFontSize: true, // should be number
          showYear: 'yes', // should be boolean
        },
        global: {
          timing: {
            introTotal: '75', // should be number
          },
        },
        comingSoon: {
          maxBooks: 'three', // should be number
        },
      }

      const result = validateTemplateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(4)

      // Check specific type errors
      expect(result.errors.some((e) => e.path === 'intro.titleFontSize')).toBe(true)
      expect(result.errors.some((e) => e.path === 'intro.showYear')).toBe(true)
    })
  })

  describe('error response format', () => {
    test('should return structured errors with field paths', () => {
      const config = {
        intro: {
          layout: 'invalid',
          titleFontSize: 'wrong-type',
        },
        unknownField: 'value',
      }

      const result = validateTemplateConfig(config)
      expect(result.valid).toBe(false)
      expect(Array.isArray(result.errors)).toBe(true)

      // Each error should have path, message, and value
      result.errors.forEach((error) => {
        expect(error).toHaveProperty('path')
        expect(error).toHaveProperty('message')
        expect(error).toHaveProperty('value')
        expect(typeof error.path).toBe('string')
        expect(typeof error.message).toBe('string')
      })

      // Check specific error content
      const layoutError = result.errors.find((e) => e.path === 'intro.layout')
      expect(layoutError).toBeDefined()
      expect(layoutError?.value).toBe('invalid')
      expect(layoutError?.message).toContain('centered')
    })
  })

  describe('edge cases', () => {
    test('should handle empty nested objects gracefully', () => {
      const config = {
        global: {},
        intro: {},
        bookReveal: {},
      }

      const result = validateTemplateConfig(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should validate all color properties as strings', () => {
      const config = {
        global: {
          colors: {
            background: 123, // should be string
            textPrimary: null, // should be string
          },
        },
      }

      const result = validateTemplateConfig(config)
      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.path === 'global.colors.background')).toBe(true)
    })
  })
})
