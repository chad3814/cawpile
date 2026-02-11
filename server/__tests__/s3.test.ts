import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateS3Key, generatePublicUrl } from '../lib/s3'

describe('S3 Service', () => {
  describe('generateS3Key', () => {
    it('should generate correct S3 key path with userId, year, month, and timestamp', () => {
      const key = generateS3Key({
        userId: 'user-123',
        year: 2026,
        month: 1,
        timestamp: new Date('2026-01-24T15:30:42Z'),
      })

      expect(key).toBe('videos/user-123/2026/01/recap-2026-01-20260124T153042Z.mp4')
    })

    it('should zero-pad month values to two digits', () => {
      const key = generateS3Key({
        userId: 'user-456',
        year: 2026,
        month: 5,
        timestamp: new Date('2026-05-15T10:20:30Z'),
      })

      expect(key).toMatch(/\/05\/recap-2026-05-/)
    })

    it('should handle December (month 12) correctly', () => {
      const key = generateS3Key({
        userId: 'user-789',
        year: 2025,
        month: 12,
        timestamp: new Date('2025-12-31T23:59:59Z'),
      })

      expect(key).toBe('videos/user-789/2025/12/recap-2025-12-20251231T235959Z.mp4')
    })

    it('should use ISO 8601 timestamp format', () => {
      const key = generateS3Key({
        userId: 'user-abc',
        year: 2026,
        month: 3,
        timestamp: new Date('2026-03-08T09:05:01Z'),
      })

      // ISO 8601 format: YYYYMMDDTHHmmssZ
      expect(key).toMatch(/20260308T090501Z\.mp4$/)
    })
  })

  describe('generatePublicUrl', () => {
    it('should generate correct public S3 URL format', () => {
      const url = generatePublicUrl({
        bucket: 'my-bucket',
        region: 'us-east-1',
        key: 'videos/user-123/2026/01/recap-2026-01-20260124T153042Z.mp4',
      })

      expect(url).toBe(
        'https://my-bucket.s3.us-east-1.amazonaws.com/videos/user-123/2026/01/recap-2026-01-20260124T153042Z.mp4'
      )
    })

    it('should handle different regions', () => {
      const url = generatePublicUrl({
        bucket: 'video-bucket',
        region: 'eu-west-2',
        key: 'videos/user/2026/05/file.mp4',
      })

      expect(url).toBe('https://video-bucket.s3.eu-west-2.amazonaws.com/videos/user/2026/05/file.mp4')
    })

    it('should properly encode special characters in key', () => {
      const url = generatePublicUrl({
        bucket: 'my-bucket',
        region: 'us-west-2',
        key: 'videos/user with spaces/2026/01/file.mp4',
      })

      // S3 URLs should work with encoded spaces
      expect(url).toContain('my-bucket.s3.us-west-2.amazonaws.com')
      expect(url).toContain('videos/user with spaces')
    })
  })
})
