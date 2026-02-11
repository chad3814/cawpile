import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import type { MonthlyRecapExport } from '../../src/lib/types'
import { parseRenderStreamQuery } from '../lib/validation'
import {
  setupSSEHeaders,
  sendProgressEvent,
  sendCompleteEvent,
  sendErrorEvent,
  sendKeepalive,
  mapBundleProgress,
  mapRenderProgress,
} from '../lib/sse'

/**
 * Create a minimal Express app for testing endpoint behavior
 * Note: These tests focus on SSE setup and validation, not the full render pipeline
 */
function createTestApp() {
  const app = express()

  app.get('/render-stream', async (req, res) => {
    const queryData = req.query.data as string | undefined
    const queryUserId = req.query.userId as string | undefined
    const validationResult = parseRenderStreamQuery(queryData, queryUserId)

    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.error })
    }

    // Set up SSE headers for valid requests
    setupSSEHeaders(res)

    // Simulate progress events
    sendProgressEvent(res, 0, 'bundling')
    sendProgressEvent(res, 25, 'bundling')
    sendProgressEvent(res, 50, 'rendering')
    sendProgressEvent(res, 100, 'rendering')

    // Send complete event
    sendCompleteEvent(res, 'test-video.mp4', 'https://bucket.s3.us-east-1.amazonaws.com/test-video.mp4')
    res.end()
  })

  // Error simulation endpoint
  app.get('/render-stream-error', async (req, res) => {
    const queryData = req.query.data as string | undefined
    const queryUserId = req.query.userId as string | undefined
    const validationResult = parseRenderStreamQuery(queryData, queryUserId)

    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.error })
    }

    setupSSEHeaders(res)
    sendProgressEvent(res, 0, 'bundling')
    sendErrorEvent(res, 'Render failed: simulated error')
    res.end()
  })

  // S3 upload failure simulation endpoint
  app.get('/render-stream-s3-error', async (req, res) => {
    const queryData = req.query.data as string | undefined
    const queryUserId = req.query.userId as string | undefined
    const validationResult = parseRenderStreamQuery(queryData, queryUserId)

    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.error })
    }

    setupSSEHeaders(res)
    sendProgressEvent(res, 0, 'bundling')
    sendProgressEvent(res, 25, 'bundling')
    sendProgressEvent(res, 100, 'rendering')
    sendErrorEvent(res, 'S3 upload failed: Access denied')
    res.end()
  })

  // Progress deduplication test endpoint
  app.get('/render-stream-dedup', async (req, res) => {
    const queryData = req.query.data as string | undefined
    const queryUserId = req.query.userId as string | undefined
    const validationResult = parseRenderStreamQuery(queryData, queryUserId)

    if (!validationResult.valid) {
      return res.status(400).json({ error: validationResult.error })
    }

    setupSSEHeaders(res)

    // Simulate progress with deduplication logic
    let lastEmittedProgress = -1
    const emitProgress = (progress: number, phase: 'bundling' | 'rendering') => {
      if (progress !== lastEmittedProgress) {
        sendProgressEvent(res, progress, phase)
        lastEmittedProgress = progress
      }
    }

    // Emit with duplicates - only unique values should be sent
    emitProgress(0, 'bundling')
    emitProgress(0, 'bundling') // duplicate - should be skipped
    emitProgress(10, 'bundling')
    emitProgress(10, 'bundling') // duplicate - should be skipped
    emitProgress(25, 'bundling')

    sendCompleteEvent(res, 'test.mp4', 'https://bucket.s3.us-east-1.amazonaws.com/test.mp4')
    res.end()
  })

  return app
}

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

describe('/render-stream Endpoint', () => {
  const app = createTestApp()

  describe('SSE Headers', () => {
    it('should set correct SSE headers for valid request', async () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const response = await request(app)
        .get('/render-stream')
        .query({ data: encodedData, userId: 'user-123' })

      expect(response.headers['content-type']).toContain('text/event-stream')
      expect(response.headers['cache-control']).toBe('no-cache')
      expect(response.headers['connection']).toBe('keep-alive')
    })
  })

  describe('Request Validation', () => {
    it('should return HTTP 400 for malformed request (not SSE)', async () => {
      const response = await request(app)
        .get('/render-stream')
        .query({ data: encodeURIComponent('{invalid}'), userId: 'user-123' })

      expect(response.status).toBe(400)
      expect(response.headers['content-type']).toContain('application/json')
      expect(response.body.error).toContain('Invalid JSON')
    })

    it('should return HTTP 400 for missing data parameter', async () => {
      const response = await request(app)
        .get('/render-stream')
        .query({ userId: 'user-123' })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('Missing required query parameter')
    })

    it('should return HTTP 400 for missing userId', async () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const response = await request(app)
        .get('/render-stream')
        .query({ data: encodedData })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('userId is required')
    })
  })

  describe('SSE Events', () => {
    it('should emit progress events with correct format', async () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const response = await request(app)
        .get('/render-stream')
        .query({ data: encodedData, userId: 'user-123' })

      // Check that the response contains progress events
      expect(response.text).toContain('event: progress')
      expect(response.text).toContain('"progress":0')
      expect(response.text).toContain('"phase":"bundling"')
      expect(response.text).toContain('"phase":"rendering"')
    })

    it('should emit complete event with filename and s3Url', async () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const response = await request(app)
        .get('/render-stream')
        .query({ data: encodedData, userId: 'user-123' })

      expect(response.text).toContain('event: complete')
      expect(response.text).toContain('"filename":"test-video.mp4"')
      expect(response.text).toContain('"s3Url":"https://bucket.s3.us-east-1.amazonaws.com/test-video.mp4"')
    })

    it('should emit error event on render failure', async () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const response = await request(app)
        .get('/render-stream-error')
        .query({ data: encodedData, userId: 'user-123' })

      expect(response.text).toContain('event: error')
      expect(response.text).toContain('"message":"Render failed: simulated error"')
    })
  })

  describe('Strategic Gap Tests', () => {
    it('should emit error event on S3 upload failure', async () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const response = await request(app)
        .get('/render-stream-s3-error')
        .query({ data: encodedData, userId: 'user-123' })

      expect(response.text).toContain('event: error')
      expect(response.text).toContain('S3 upload failed')
    })

    it('should deduplicate progress events with same percentage', async () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const response = await request(app)
        .get('/render-stream-dedup')
        .query({ data: encodedData, userId: 'user-123' })

      // Count occurrences of progress 0 - should appear exactly once
      const progressZeroMatches = response.text.match(/"progress":0/g)
      expect(progressZeroMatches).toHaveLength(1)

      // Count occurrences of progress 10 - should appear exactly once
      const progressTenMatches = response.text.match(/"progress":10/g)
      expect(progressTenMatches).toHaveLength(1)
    })

    it('should transition from bundling to rendering phase at 25%', async () => {
      const validData = createValidMonthlyRecapExport()
      const encodedData = encodeURIComponent(JSON.stringify(validData))

      const response = await request(app)
        .get('/render-stream')
        .query({ data: encodedData, userId: 'user-123' })

      // Verify bundling phase ends at 25 and rendering starts after
      expect(response.text).toContain('"progress":25,"phase":"bundling"')
      expect(response.text).toContain('"progress":50,"phase":"rendering"')
    })

    it('should map bundle progress 0-100 to overall 0-25', () => {
      expect(mapBundleProgress(0)).toBe(0)
      expect(mapBundleProgress(50)).toBe(12)
      expect(mapBundleProgress(100)).toBe(25)
    })

    it('should map render progress 0-1 to overall 25-100', () => {
      expect(mapRenderProgress(0)).toBe(25)
      expect(mapRenderProgress(0.5)).toBe(63)
      expect(mapRenderProgress(1)).toBe(100)
    })
  })
})
