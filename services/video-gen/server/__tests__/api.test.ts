import { describe, it, expect } from 'vitest'
import type { RenderRequest, RenderResponse, RenderErrorResponse, MonthlyRecapExport } from '../../src/lib/types'

// Test helper to create a valid MonthlyRecapExport
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

describe('API Schema Types', () => {
  describe('RenderRequest', () => {
    it('should have userId as required string field', () => {
      const validRequest: RenderRequest = {
        userId: 'user-123',
        data: createValidMonthlyRecapExport(),
      }

      expect(validRequest.userId).toBe('user-123')
      expect(typeof validRequest.userId).toBe('string')
    })

    it('should have data field containing MonthlyRecapExport', () => {
      const validRequest: RenderRequest = {
        userId: 'user-123',
        data: createValidMonthlyRecapExport(),
      }

      expect(validRequest.data).toBeDefined()
      expect(validRequest.data.meta).toBeDefined()
      expect(validRequest.data.books).toBeDefined()
      expect(validRequest.data.stats).toBeDefined()
    })
  })

  describe('RenderResponse', () => {
    it('should include s3Url field for successful responses', () => {
      const response: RenderResponse = {
        success: true,
        filename: 'recap-2026-01-1706123456789.mp4',
        s3Url: 'https://bucket.s3.us-east-1.amazonaws.com/videos/user/2026/01/recap.mp4',
        duration: 30.5,
        renderTime: '15.2',
      }

      expect(response.s3Url).toBeDefined()
      expect(response.s3Url).toContain('s3')
      expect(response.success).toBe(true)
    })

    it('should include filename and duration fields', () => {
      const response: RenderResponse = {
        success: true,
        filename: 'recap-2026-01-1706123456789.mp4',
        s3Url: 'https://bucket.s3.us-east-1.amazonaws.com/videos/user/2026/01/recap.mp4',
        duration: 30.5,
        renderTime: '15.2',
      }

      expect(response.filename).toBeDefined()
      expect(response.duration).toBeDefined()
      expect(typeof response.duration).toBe('number')
    })
  })

  describe('RenderErrorResponse', () => {
    it('should include error and message fields', () => {
      const errorResponse: RenderErrorResponse = {
        error: 'S3 upload failed',
        message: 'Access denied to bucket',
      }

      expect(errorResponse.error).toBeDefined()
      expect(errorResponse.message).toBeDefined()
    })
  })
})

describe('userId Validation Logic', () => {
  // These tests validate the logic that will be used in the endpoint
  function validateUserId(userId: unknown): { valid: boolean; error?: string } {
    if (!userId) {
      return { valid: false, error: 'userId is required' }
    }
    if (typeof userId !== 'string') {
      return { valid: false, error: 'userId must be a string' }
    }
    if (userId.trim() === '') {
      return { valid: false, error: 'userId cannot be empty' }
    }
    return { valid: true }
  }

  it('should reject missing userId', () => {
    const result = validateUserId(undefined)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('required')
  })

  it('should reject empty string userId', () => {
    const result = validateUserId('')
    expect(result.valid).toBe(false)
  })

  it('should reject whitespace-only userId', () => {
    const result = validateUserId('   ')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('empty')
  })

  it('should accept valid userId string', () => {
    const result = validateUserId('user-123')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })
})
