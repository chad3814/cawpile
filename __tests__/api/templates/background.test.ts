/**
 * @jest-environment node
 */

// Mock auth before importing route handlers
jest.mock('@/lib/auth/admin', () => ({
  getCurrentUser: jest.fn(),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    videoTemplate: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

// Mock S3 operations
jest.mock('@/lib/s3', () => ({
  s3Client: { send: jest.fn() },
  AWS_S3_BUCKET: 'test-bucket',
  getS3PublicUrl: jest.fn((key: string) => `https://test-bucket.s3.us-east-2.amazonaws.com/${key}`),
}))

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
}))

jest.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}))

jest.mock('@/lib/s3-upload', () => ({
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  getExtensionFromContentType: jest.fn((ct: string) => {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }
    return map[ct] || 'jpg'
  }),
  VALID_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  isValidImageType: jest.fn(),
  extractKeyFromUrl: jest.fn((url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname.slice(1)
    } catch {
      return null
    }
  }),
  deleteAvatar: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/audit/logger', () => ({
  logAdminAction: jest.fn(),
  logFieldChanges: jest.fn(),
}))

jest.mock('@/lib/video/validateTemplateConfig', () => ({
  validateTemplateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] }),
}))

import { getCurrentUser } from '@/lib/auth/admin'
import prisma from '@/lib/prisma'
import { deleteAvatar, extractKeyFromUrl } from '@/lib/s3-upload'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockFindUnique = prisma.videoTemplate.findUnique as jest.MockedFunction<typeof prisma.videoTemplate.findUnique>
const mockDelete = prisma.videoTemplate.delete as jest.MockedFunction<typeof prisma.videoTemplate.delete>

// Import route handlers
import { POST as presignedUrlPOST } from '@/app/api/templates/[id]/background/presigned-url/route'
import { POST as backgroundPOST, DELETE as backgroundDELETE } from '@/app/api/templates/[id]/background/route'
import { DELETE as templateDELETE } from '@/app/api/templates/[id]/route'

const testAdmin = {
  id: 'test-admin-id',
  email: 'admin@test.com',
  name: 'Test Admin',
  isAdmin: true,
  isSuperAdmin: false,
}

const testNonAdmin = {
  id: 'test-user-id',
  email: 'user@test.com',
  name: 'Test User',
  isAdmin: false,
  isSuperAdmin: false,
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/templates/test-id/background/presigned-url', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id = 'test-template-id') {
  return { params: Promise.resolve({ id }) }
}

describe('Template Background API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCurrentUser.mockResolvedValue(testAdmin)
    mockFindUnique.mockResolvedValue({
      id: 'test-template-id',
      name: 'Test Template',
      config: {},
    } as never)
  })

  describe('POST /api/templates/[id]/background/presigned-url', () => {
    it('should return 401 for non-admin users', async () => {
      mockGetCurrentUser.mockResolvedValue(testNonAdmin)

      const req = makeRequest({
        contentType: 'image/jpeg',
        fileSize: 1000,
        sequence: 'global',
      })

      const response = await presignedUrlPOST(req, makeParams())
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return presigned URL, key, and public URL for valid request', async () => {
      const req = makeRequest({
        contentType: 'image/jpeg',
        fileSize: 1000,
        sequence: 'global',
      })

      const response = await presignedUrlPOST(req, makeParams())
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.presignedUrl).toBeDefined()
      expect(data.key).toMatch(/^template-backgrounds\/test-template-id\/global-\d+\.jpg$/)
      expect(data.publicUrl).toContain('template-backgrounds')
    })

    it('should reject GIF content type (only JPEG, PNG, WebP allowed)', async () => {
      const req = makeRequest({
        contentType: 'image/gif',
        fileSize: 1000,
        sequence: 'global',
      })

      const response = await presignedUrlPOST(req, makeParams())
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid content type')
    })

    it('should reject file size exceeding 5MB', async () => {
      const req = makeRequest({
        contentType: 'image/jpeg',
        fileSize: 6 * 1024 * 1024,
        sequence: 'global',
      })

      const response = await presignedUrlPOST(req, makeParams())
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('File size exceeds')
    })

    it('should validate sequence parameter against allowed values', async () => {
      const req = makeRequest({
        contentType: 'image/jpeg',
        fileSize: 1000,
        sequence: 'invalidSequence',
      })

      const response = await presignedUrlPOST(req, makeParams())
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Invalid sequence')
    })
  })

  describe('POST /api/templates/[id]/background (processing)', () => {
    it('should return 400 for missing key or sequence', async () => {
      const req = new NextRequest('http://localhost:3000/api/templates/test-id/background', {
        method: 'POST',
        body: JSON.stringify({ sequence: 'global' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await backgroundPOST(req, makeParams())
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('S3 key is required')
    })
  })

  describe('DELETE /api/templates/[id]/background', () => {
    it('should remove background URL from config via S3 deletion', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-template-id',
        name: 'Test Template',
        config: {
          global: {
            backgroundImage: 'https://test-bucket.s3.us-east-2.amazonaws.com/template-backgrounds/test-template-id/global-123.jpg',
          },
        },
      } as never)

      const req = new NextRequest('http://localhost:3000/api/templates/test-id/background', {
        method: 'DELETE',
        body: JSON.stringify({ sequence: 'global' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await backgroundDELETE(req, makeParams())
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify S3 deletion was attempted
      expect(deleteAvatar).toHaveBeenCalled()
    })
  })

  describe('DELETE /api/templates/[id] (S3 cleanup)', () => {
    it('should clean up S3 background images from config JSON on template deletion', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'test-template-id',
        name: 'Test Template',
        config: {
          global: {
            backgroundImage: 'https://test-bucket.s3.us-east-2.amazonaws.com/template-backgrounds/test-template-id/global-123.jpg',
          },
          intro: {
            backgroundImage: 'https://test-bucket.s3.us-east-2.amazonaws.com/template-backgrounds/test-template-id/intro-456.jpg',
          },
        },
      } as never)
      mockDelete.mockResolvedValue({} as never)

      const req = new NextRequest('http://localhost:3000/api/templates/test-template-id', {
        method: 'DELETE',
      })

      const response = await templateDELETE(req, makeParams())
      expect(response.status).toBe(200)

      // Verify S3 cleanup was called for both background images
      expect(extractKeyFromUrl).toHaveBeenCalledTimes(2)
      expect(deleteAvatar).toHaveBeenCalledTimes(2)
    })
  })
})
