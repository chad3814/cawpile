import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

// Create mockable instances
const mockSend = vi.fn()

// Mock the AWS SDK
vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class MockS3Client {
      send = mockSend
    },
    PutObjectCommand: class MockPutObjectCommand {
      public params: Record<string, unknown>
      constructor(params: Record<string, unknown>) {
        this.params = params
      }
    },
  }
})

import { generateS3Key, uploadToS3, resetS3Client } from '../lib/s3'
import { deleteLocalFile } from '../lib/cleanup'

describe('S3 Integration Tests', () => {
  let testDir: string
  let testFilePath: string

  beforeEach(async () => {
    // Set up environment variables
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'
    process.env.AWS_REGION = 'us-east-1'
    process.env.S3_BUCKET_NAME = 'test-bucket'

    // Reset S3 client
    resetS3Client()

    // Create test directory and file
    testDir = path.join(os.tmpdir(), `integration-test-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
    testFilePath = path.join(testDir, 'test-video.mp4')
    await fs.writeFile(testFilePath, 'mock video content')

    mockSend.mockReset()
  })

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
    vi.clearAllMocks()
  })

  describe('Complete Upload-to-Cleanup Workflow', () => {
    it('should upload file to S3 and delete local file on success', async () => {
      mockSend.mockResolvedValue({})

      // Generate S3 key
      const s3Key = generateS3Key({
        userId: 'user-123',
        year: 2026,
        month: 1,
        timestamp: new Date('2026-01-24T15:30:42Z'),
      })

      // Upload to S3
      const result = await uploadToS3({
        filePath: testFilePath,
        key: s3Key,
      })

      // Verify upload returned expected result
      expect(result.url).toContain('test-bucket')
      expect(result.key).toBe(s3Key)

      // Delete local file after successful upload
      await deleteLocalFile(testFilePath)

      // Verify local file is deleted
      const fileExists = await fs
        .access(testFilePath)
        .then(() => true)
        .catch(() => false)
      expect(fileExists).toBe(false)
    })

    it('should preserve local file when S3 upload fails', async () => {
      mockSend.mockRejectedValue(new Error('S3 Access Denied'))

      const s3Key = generateS3Key({
        userId: 'user-456',
        year: 2026,
        month: 2,
        timestamp: new Date('2026-02-15T10:00:00Z'),
      })

      // Attempt upload (should fail)
      let uploadError: Error | null = null
      try {
        await uploadToS3({
          filePath: testFilePath,
          key: s3Key,
        })
      } catch (error) {
        uploadError = error as Error
      }

      // Verify upload failed
      expect(uploadError).not.toBeNull()
      expect(uploadError?.message).toContain('S3 upload failed')

      // Verify local file is preserved (NOT deleted)
      const fileExists = await fs
        .access(testFilePath)
        .then(() => true)
        .catch(() => false)
      expect(fileExists).toBe(true)
    })
  })

  describe('S3 Key Generation for Different Users and Months', () => {
    it('should generate unique keys for different users with same month/year', () => {
      const timestamp = new Date('2026-03-10T12:00:00Z')

      const key1 = generateS3Key({ userId: 'user-a', year: 2026, month: 3, timestamp })
      const key2 = generateS3Key({ userId: 'user-b', year: 2026, month: 3, timestamp })

      expect(key1).not.toBe(key2)
      expect(key1).toContain('user-a')
      expect(key2).toContain('user-b')
    })

    it('should organize files by year and month in path', () => {
      const key = generateS3Key({
        userId: 'user-test',
        year: 2026,
        month: 12,
        timestamp: new Date('2026-12-25T00:00:00Z'),
      })

      expect(key).toMatch(/^videos\/user-test\/2026\/12\/recap-/)
      expect(key).toContain('recap-2026-12-')
    })
  })
})
