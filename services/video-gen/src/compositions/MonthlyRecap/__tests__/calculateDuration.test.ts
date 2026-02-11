import { describe, it, expect } from 'vitest'
import { calculateDuration } from '../index'
import { DEFAULT_TEMPLATE } from '../../../lib/template-types'
import { TIMING } from '../../../lib/theme'
import type { MonthlyRecapExport } from '../../../lib/types'

// Test fixture factory
function createTestData(overrides: Partial<MonthlyRecapExport> = {}): MonthlyRecapExport {
  return {
    meta: {
      month: 1,
      year: 2026,
      monthName: 'January',
      generatedAt: '2026-01-31T00:00:00Z',
    },
    books: [],
    currentlyReading: [],
    stats: {
      totalBooks: 0,
      completedCount: 0,
      dnfCount: 0,
      totalPages: 0,
      averageRating: null,
      topRatedBook: null,
      lowestRatedBook: null,
    },
    ...overrides,
  }
}

describe('calculateDuration', () => {
  describe('with default template', () => {
    it('should calculate correct duration with no books and no currently reading', () => {
      const data = createTestData()

      const duration = calculateDuration(data)

      // Expected: introTotal + statsTotal + outroTotal - overlaps
      // With no books and no currently reading:
      // 75 + 120 + 90 - (6 * (1 + 0 + 0 + 1)) = 285 - 12 = 273
      const expectedOverlaps = TIMING.transitionOverlap * (1 + 0 + 0 + 1)
      const expected = TIMING.introTotal + TIMING.statsTotal + TIMING.outroTotal - expectedOverlaps

      expect(duration).toBe(expected)
    })

    it('should calculate correct duration with 3 books', () => {
      const data = createTestData({
        books: [
          { id: '1', title: 'Book 1', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-15', rating: null, pageCount: 100 },
          { id: '2', title: 'Book 2', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-20', rating: null, pageCount: 200 },
          { id: '3', title: 'Book 3', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-25', rating: null, pageCount: 300 },
        ],
        stats: {
          totalBooks: 3,
          completedCount: 3,
          dnfCount: 0,
          totalPages: 600,
          averageRating: 7.5,
          topRatedBook: null,
          lowestRatedBook: null,
        },
      })

      const duration = calculateDuration(data)

      // Expected: intro + (3 * book) + stats + outro - overlaps
      // Overlaps: 6 * (1 + 3 + 0 + 1) = 30
      const expectedOverlaps = TIMING.transitionOverlap * (1 + 3 + 0 + 1)
      const expected = TIMING.introTotal + (3 * TIMING.bookTotal) + TIMING.statsTotal + TIMING.outroTotal - expectedOverlaps

      expect(duration).toBe(expected)
    })

    it('should include coming soon frames when currentlyReading has books', () => {
      const data = createTestData({
        currentlyReading: [
          { id: 'cr1', title: 'Reading Now', authors: [], coverUrl: null, progress: 50 },
        ],
      })

      const duration = calculateDuration(data)

      // Expected: intro + stats + comingSoon + outro - overlaps
      // Overlaps: 6 * (1 + 0 + 1 + 1) = 18
      const expectedOverlaps = TIMING.transitionOverlap * (1 + 0 + 1 + 1)
      const expected = TIMING.introTotal + TIMING.statsTotal + TIMING.comingSoonTotal + TIMING.outroTotal - expectedOverlaps

      expect(duration).toBe(expected)
    })

    it('should match current behavior when no template provided (backward compatibility)', () => {
      const data = createTestData({
        books: [
          { id: '1', title: 'Book 1', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-15', rating: null, pageCount: 100 },
          { id: '2', title: 'Book 2', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-20', rating: null, pageCount: 200 },
        ],
        currentlyReading: [
          { id: 'cr1', title: 'Reading Now', authors: [], coverUrl: null, progress: 50 },
        ],
      })

      // Duration with no template should match duration with default template
      const durationNoTemplate = calculateDuration(data)
      const durationWithDefault = calculateDuration(data, DEFAULT_TEMPLATE)

      expect(durationNoTemplate).toBe(durationWithDefault)
    })
  })

  describe('with custom timing values', () => {
    it('should use custom timing values from template', () => {
      const data = createTestData({
        books: [
          { id: '1', title: 'Book 1', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-15', rating: null, pageCount: 100 },
        ],
      })

      const customTemplate = {
        global: {
          timing: {
            introTotal: 100, // Custom: was 75
            bookTotal: 200,  // Custom: was 150
            statsTotal: 150, // Custom: was 120
            outroTotal: 100, // Custom: was 90
            transitionOverlap: 10, // Custom: was 6
          },
        },
      }

      const duration = calculateDuration(data, customTemplate)

      // Expected: 100 + (1 * 200) + 150 + 100 - (10 * (1 + 1 + 0 + 1)) = 550 - 30 = 520
      expect(duration).toBe(520)
    })
  })

  describe('with grid layout', () => {
    it('should calculate shorter duration for grid layout (all books at once)', () => {
      const data = createTestData({
        books: [
          { id: '1', title: 'Book 1', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-15', rating: null, pageCount: 100 },
          { id: '2', title: 'Book 2', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-20', rating: null, pageCount: 200 },
          { id: '3', title: 'Book 3', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-25', rating: null, pageCount: 300 },
        ],
      })

      const sequentialDuration = calculateDuration(data) // Default sequential layout
      const gridDuration = calculateDuration(data, { bookReveal: { layout: 'grid' } })

      // Grid should be shorter because all books shown at once
      expect(gridDuration).toBeLessThan(sequentialDuration)

      // With grid layout: books shown once, not per-book
      // intro + bookTotal (once) + stats + outro - (overlaps for grid)
      const expectedOverlaps = TIMING.transitionOverlap * (1 + 1 + 0 + 1)
      const expectedGrid = TIMING.introTotal + TIMING.bookTotal + TIMING.statsTotal + TIMING.outroTotal - expectedOverlaps

      expect(gridDuration).toBe(expectedGrid)
    })

    it('should handle grid layout with no books', () => {
      const data = createTestData({ books: [] })

      const gridDuration = calculateDuration(data, { bookReveal: { layout: 'grid' } })

      // Should still work with no books - no book frames added
      const expectedOverlaps = TIMING.transitionOverlap * (1 + 0 + 0 + 1)
      const expected = TIMING.introTotal + TIMING.statsTotal + TIMING.outroTotal - expectedOverlaps

      expect(gridDuration).toBe(expected)
    })
  })

  describe('carousel layout', () => {
    it('should use per-book timing for carousel layout', () => {
      const data = createTestData({
        books: [
          { id: '1', title: 'Book 1', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-15', rating: null, pageCount: 100 },
          { id: '2', title: 'Book 2', authors: [], coverUrl: null, status: 'COMPLETED', finishDate: '2026-01-20', rating: null, pageCount: 200 },
        ],
      })

      const carouselDuration = calculateDuration(data, { bookReveal: { layout: 'carousel' } })
      const sequentialDuration = calculateDuration(data) // Default sequential

      // Carousel should have same duration as sequential (per-book timing)
      expect(carouselDuration).toBe(sequentialDuration)
    })
  })
})
