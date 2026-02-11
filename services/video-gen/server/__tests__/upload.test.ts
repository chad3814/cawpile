import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

// Create mockable instances
const mockSend = vi.fn()
const capturedCommands: Record<string, unknown>[] = []

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
        capturedCommands.push(params)
      }
    },
  }
})

// Import after mocking
import { uploadToS3, resetS3Client } from '../lib/s3'

describe('uploadToS3', () => {
  let testDir: string
  let testFilePath: string

  beforeEach(async () => {
    // Set up environment variables for tests
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'
    process.env.AWS_REGION = 'us-east-1'
    process.env.S3_BUCKET_NAME = 'test-bucket'

    // Reset the S3 client singleton for each test
    resetS3Client()

    // Clear captured commands
    capturedCommands.length = 0

    // Create a temporary test directory and file
    testDir = path.join(os.tmpdir(), `upload-test-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
    testFilePath = path.join(testDir, 'test-video.mp4')
    await fs.writeFile(testFilePath, 'mock video content for testing')

    // Reset mock
    mockSend.mockReset()
    mockSend.mockResolvedValue({})
  })

  afterEach(async () => {
    // Clean up
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
    vi.clearAllMocks()
  })

  it('should upload file and return public URL', async () => {
    mockSend.mockResolvedValue({})

    const result = await uploadToS3({
      filePath: testFilePath,
      key: 'videos/user-123/2026/01/recap-2026-01-20260124T153042Z.mp4',
    })

    expect(result.url).toContain('s3')
    expect(result.url).toContain('test-bucket')
    expect(result.key).toBe('videos/user-123/2026/01/recap-2026-01-20260124T153042Z.mp4')
  })

  it('should set ContentType to video/mp4', async () => {
    mockSend.mockResolvedValue({})

    await uploadToS3({
      filePath: testFilePath,
      key: 'videos/user/file.mp4',
    })

    // Verify PutObjectCommand was called with correct ContentType
    expect(capturedCommands.length).toBe(1)
    expect(capturedCommands[0]).toMatchObject({
      ContentType: 'video/mp4',
    })
  })

  it('should read file as Buffer from disk', async () => {
    mockSend.mockResolvedValue({})

    await uploadToS3({
      filePath: testFilePath,
      key: 'videos/user/file.mp4',
    })

    // Verify PutObjectCommand was called with a Body (the file buffer)
    expect(capturedCommands.length).toBe(1)
    expect(capturedCommands[0].Body).toBeInstanceOf(Buffer)
  })

  it('should throw error when S3 upload fails', async () => {
    mockSend.mockRejectedValue(new Error('Access Denied'))

    await expect(
      uploadToS3({
        filePath: testFilePath,
        key: 'videos/user/file.mp4',
      })
    ).rejects.toThrow('S3 upload failed')
  })

  it('should include S3 error message in thrown error', async () => {
    mockSend.mockRejectedValue(new Error('NoSuchBucket: The bucket does not exist'))

    try {
      await uploadToS3({
        filePath: testFilePath,
        key: 'videos/user/file.mp4',
      })
      expect.fail('Should have thrown an error')
    } catch (error) {
      expect((error as Error).message).toContain('NoSuchBucket')
    }
  })
})
