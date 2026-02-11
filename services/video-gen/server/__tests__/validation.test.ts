import { describe, it, expect } from 'vitest'
import { parseRenderStreamQuery } from '../lib/validation'
import type { MonthlyRecapExport } from '../../src/lib/types'

/**
 * Create a valid MonthlyRecapExport for testing
 */
function createValidMonthlyRecapExport(): MonthlyRecapExport {
  return {
    meta: {
      month: 1,
      year: 2026,
      monthName: 'January',
      generatedAt: '2026-01-24T15:30:42Z',
    },
    books: [
      {
        id: 'book-1',
        title: 'Test Book',
        authors: ['Test Author'],
        coverUrl: 'https://example.com/cover.jpg',
        status: 'COMPLETED',
        finishDate: '2026-01-15',
        rating: {
          average: 4.5,
          characters: 4,
          atmosphere: 5,
          writing: 4,
          plot: 5,
          intrigue: 4,
          logic: 4,
          enjoyment: 5,
        },
        pageCount: 300,
      },
    ],
    currentlyReading: [],
    stats: {
      totalBooks: 1,
      completedCount: 1,
      dnfCount: 0,
      totalPages: 300,
      averageRating: 4.5,
      topRatedBook: {
        title: 'Test Book',
        coverUrl: 'https://example.com/cover.jpg',
        rating: 4.5,
      },
      lowestRatedBook: null,
    },
  }
}

describe('Validation Utilities', () => {
  describe('parseRenderStreamQuery', () => {
    it('should parse valid URL-encoded JSON with separate userId', () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))
      const userId = 'user-123'

      const result = parseRenderStreamQuery(encodedData, userId)

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.userId).toBe('user-123')
        expect(result.data.data.meta.monthName).toBe('January')
      }
    })

    it('should return error for missing userId query parameter', () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const result = parseRenderStreamQuery(encodedData, undefined)

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('userId is required')
      }
    })

    it('should return error for empty userId query parameter', () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const result = parseRenderStreamQuery(encodedData, '   ')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('userId cannot be empty')
      }
    })

    it('should return error for missing data query parameter', () => {
      const result = parseRenderStreamQuery(undefined, 'user-123')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Missing required query parameter')
      }
    })

    it('should return error for empty data query parameter', () => {
      const result = parseRenderStreamQuery('', 'user-123')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Missing required query parameter')
      }
    })

    it('should return error for malformed JSON', () => {
      const malformedJson = encodeURIComponent('{invalid json}')

      const result = parseRenderStreamQuery(malformedJson, 'user-123')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Invalid JSON')
      }
    })

    it('should return error for missing data.meta', () => {
      const dataWithoutMeta = {
        books: [],
        stats: { totalBooks: 0 },
      }
      const encoded = encodeURIComponent(JSON.stringify(dataWithoutMeta))

      const result = parseRenderStreamQuery(encoded, 'user-123')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('data.meta is required')
      }
    })

    it('should return error for missing data.books', () => {
      const dataWithoutBooks = {
        meta: { month: 1, year: 2026 },
        stats: { totalBooks: 0 },
      }
      const encoded = encodeURIComponent(JSON.stringify(dataWithoutBooks))

      const result = parseRenderStreamQuery(encoded, 'user-123')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('data.books is required')
      }
    })

    it('should return error for missing data.stats', () => {
      const dataWithoutStats = {
        meta: { month: 1, year: 2026 },
        books: [],
      }
      const encoded = encodeURIComponent(JSON.stringify(dataWithoutStats))

      const result = parseRenderStreamQuery(encoded, 'user-123')

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('data.stats is required')
      }
    })
  })
})
