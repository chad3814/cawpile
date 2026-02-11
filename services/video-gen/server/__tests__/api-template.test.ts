import { describe, it, expect } from 'vitest'
import { parseRenderStreamQuery } from '../lib/validation'
import { validateTemplate } from '../lib/template-validation'
import { DEFAULT_TEMPLATE } from '../../src/lib/template-types'

/**
 * Tests for API template handling in validation and parsing
 */
describe('API Template Handling', () => {
  // Sample test data
  const validData = {
    meta: { month: 1, year: 2026, monthName: 'January', generatedAt: '2026-01-31T00:00:00Z' },
    books: [],
    stats: { totalBooks: 0, completedCount: 0, dnfCount: 0, totalPages: 0, averageRating: null, topRatedBook: null, lowestRatedBook: null },
    currentlyReading: [],
  }

  describe('parseRenderStreamQuery with template', () => {
    it('should parse request without template (backward compatibility)', () => {
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const result = parseRenderStreamQuery(encodedData, 'user123')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.userId).toBe('user123')
        expect(result.data.template).toBeUndefined()
      }
    })

    it('should parse request with valid template via query parameter', () => {
      const encodedData = encodeURIComponent(JSON.stringify(validData))
      const template = { global: { colors: { accent: '#ff0000' } } }
      const encodedTemplate = encodeURIComponent(JSON.stringify(template))

      const result = parseRenderStreamQuery(encodedData, 'user123', encodedTemplate)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.userId).toBe('user123')
        expect(result.data.template).toBeDefined()
        expect(result.data.template?.global?.colors?.accent).toBe('#ff0000')
      }
    })

    it('should return error for invalid JSON in template parameter', () => {
      const encodedData = encodeURIComponent(JSON.stringify(validData))
      const invalidTemplate = encodeURIComponent('not valid json {{{')

      const result = parseRenderStreamQuery(encodedData, 'user123', invalidTemplate)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Invalid JSON in template parameter')
      }
    })

    it('should accept template with unknown properties (permissive validation)', () => {
      const encodedData = encodeURIComponent(JSON.stringify(validData))
      const templateWithUnknown = {
        global: { colors: { accent: '#ff0000' } },
        unknownSection: { foo: 'bar' },
      }
      const encodedTemplate = encodeURIComponent(JSON.stringify(templateWithUnknown))

      const result = parseRenderStreamQuery(encodedData, 'user123', encodedTemplate)

      // Should still be valid (unknown properties are stripped, not rejected)
      expect(result.valid).toBe(true)
    })

    it('should handle empty template string', () => {
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const result = parseRenderStreamQuery(encodedData, 'user123', '')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.template).toBeUndefined()
      }
    })

    it('should handle whitespace-only template string', () => {
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const result = parseRenderStreamQuery(encodedData, 'user123', '   ')

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.template).toBeUndefined()
      }
    })
  })

  describe('validateTemplate for API use', () => {
    it('should return valid result for valid template', () => {
      const template = {
        global: {
          colors: { accent: '#ff0000' },
          fonts: { heading: 'CustomFont' },
        },
        intro: { layout: 'split' },
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(true)
      expect(result.sanitizedTemplate.global.colors.accent).toBe('#ff0000')
      expect(result.sanitizedTemplate.global.fonts.heading).toBe('CustomFont')
      expect(result.sanitizedTemplate.intro.layout).toBe('split')
    })

    it('should strip unknown properties but not reject request', () => {
      const template = {
        global: { colors: { accent: '#ff0000' } },
        unknownSection: 'should be stripped',
        intro: { unknownProp: true },
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(true)
      expect(result.warnings).toContain('unknownSection')
      expect(result.warnings.some(w => w.includes('intro.unknownProp'))).toBe(true)
    })

    it('should return defaults for empty template', () => {
      const result = validateTemplate({})

      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
      expect(result.sanitizedTemplate).toEqual(DEFAULT_TEMPLATE)
    })

    it('should return defaults for null template', () => {
      const result = validateTemplate(null)

      expect(result.valid).toBe(true)
      expect(result.sanitizedTemplate).toEqual(DEFAULT_TEMPLATE)
    })

    it('should handle invalid layout values gracefully', () => {
      const template = {
        intro: { layout: 'invalid-layout' },
        bookReveal: { layout: 'not-a-real-layout' },
      }

      const result = validateTemplate(template)

      expect(result.valid).toBe(true)
      // Invalid layouts should be stripped, defaults used
      expect(result.sanitizedTemplate.intro.layout).toBe(DEFAULT_TEMPLATE.intro.layout)
      expect(result.sanitizedTemplate.bookReveal.layout).toBe(DEFAULT_TEMPLATE.bookReveal.layout)
    })
  })

  describe('Template in RenderRequest', () => {
    it('should include template in parsed RenderRequest when provided', () => {
      const encodedData = encodeURIComponent(JSON.stringify(validData))
      const template = {
        global: {
          colors: { background: '#111111' },
          timing: { introTotal: 100 },
        },
        bookReveal: { layout: 'grid' },
      }
      const encodedTemplate = encodeURIComponent(JSON.stringify(template))

      const result = parseRenderStreamQuery(encodedData, 'user123', encodedTemplate)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.template).toBeDefined()
        expect(result.data.template?.global?.colors?.background).toBe('#111111')
        expect(result.data.template?.global?.timing?.introTotal).toBe(100)
        expect(result.data.template?.bookReveal?.layout).toBe('grid')
      }
    })
  })
})
