/**
 * @jest-environment node
 */

/**
 * Integration tests for Template Background Images feature
 * Task Group 6.3: Strategic gap-filling tests across the feature
 */

// Mock auth before importing route handlers
jest.mock('@/lib/auth/admin', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    videoTemplate: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
  },
}))

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
import { extractKeyFromUrl, deleteAvatar } from '@/lib/s3-upload'
import { validateTemplateConfig } from '@/lib/video/validateTemplateConfig'
import { assembleConfig, buildInitialState, resolveConfig } from '@/components/templates/TemplateEditorClient'
import type { VideoTemplate } from '@/types/video-template'
import { NextRequest } from 'next/server'

// Mocks for the timing module
jest.mock('@/lib/video/timingCalculation', () => ({
  calculateSubTimings: jest.fn(),
  assembleFullTimingConfig: jest.fn((totals: Record<string, number>) => totals),
}))

import { assembleFullTimingConfig } from '@/lib/video/timingCalculation'
import { POST as presignedUrlPOST } from '@/app/api/templates/[id]/background/presigned-url/route'
import { POST as backgroundPOST } from '@/app/api/templates/[id]/background/route'
import { DELETE as templateDELETE } from '@/app/api/templates/[id]/route'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockFindUnique = prisma.videoTemplate.findUnique as jest.MockedFunction<typeof prisma.videoTemplate.findUnique>
const mockDelete = prisma.videoTemplate.delete as jest.MockedFunction<typeof prisma.videoTemplate.delete>
const mockValidate = validateTemplateConfig as jest.MockedFunction<typeof validateTemplateConfig>

const testAdmin = {
  id: 'test-admin-id',
  email: 'admin@test.com',
  name: 'Test Admin',
  isAdmin: true,
  isSuperAdmin: false,
}

function makeParams(id = 'test-template-id') {
  return { params: Promise.resolve({ id }) }
}

describe('Template Background Images Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetCurrentUser.mockResolvedValue(testAdmin)
    mockValidate.mockReturnValue({ valid: true, errors: [] })
  })

  describe('template duplication preserves background URLs', () => {
    it('should preserve background image URLs when config JSON is duplicated', () => {
      const originalConfig: VideoTemplate = {
        global: {
          backgroundImage: 'https://bucket.s3.amazonaws.com/template-backgrounds/t1/global-123-resized.jpg',
          backgroundOverlayOpacity: 0.5,
        },
        intro: {
          backgroundImage: 'https://bucket.s3.amazonaws.com/template-backgrounds/t1/intro-456-resized.jpg',
          backgroundOverlayOpacity: 0.3,
        },
        bookReveal: {
          backgroundImage: null,
          backgroundOverlayOpacity: null,
        },
      }

      // Duplicating = JSON deep copy
      const duplicatedConfig = JSON.parse(JSON.stringify(originalConfig)) as VideoTemplate

      // Background URLs must be preserved
      expect(duplicatedConfig.global?.backgroundImage).toBe(originalConfig.global?.backgroundImage)
      expect(duplicatedConfig.intro?.backgroundImage).toBe(originalConfig.intro?.backgroundImage)
      expect(duplicatedConfig.bookReveal?.backgroundImage).toBeNull()
    })
  })

  describe('S3 cleanup on template deletion extracts all background URLs', () => {
    it('should extract and delete background URLs from global + all sequences', async () => {
      const configWithAllBackgrounds = {
        global: {
          backgroundImage: 'https://test-bucket.s3.us-east-2.amazonaws.com/template-backgrounds/tid/global-1-resized.jpg',
        },
        intro: {
          backgroundImage: 'https://test-bucket.s3.us-east-2.amazonaws.com/template-backgrounds/tid/intro-2-resized.jpg',
        },
        bookReveal: {
          backgroundImage: 'https://test-bucket.s3.us-east-2.amazonaws.com/template-backgrounds/tid/bookReveal-3-resized.jpg',
        },
        statsReveal: {
          backgroundImage: null, // no background
        },
        comingSoon: {
          backgroundImage: 'https://test-bucket.s3.us-east-2.amazonaws.com/template-backgrounds/tid/comingSoon-4-resized.jpg',
        },
        outro: {
          backgroundImage: 'https://test-bucket.s3.us-east-2.amazonaws.com/template-backgrounds/tid/outro-5-resized.jpg',
        },
      }

      mockFindUnique.mockResolvedValue({
        id: 'test-template-id',
        name: 'Test Template',
        config: configWithAllBackgrounds,
      } as never)
      mockDelete.mockResolvedValue({} as never)

      const req = new NextRequest('http://localhost:3000/api/templates/test-template-id', {
        method: 'DELETE',
      })

      const response = await templateDELETE(req, makeParams())
      expect(response.status).toBe(200)

      // Should extract and attempt to delete 5 background URLs (global + 4 sequences, statsReveal is null)
      expect(extractKeyFromUrl).toHaveBeenCalledTimes(5)
      expect(deleteAvatar).toHaveBeenCalledTimes(5)
    })
  })

  describe('assembleConfig with mixed state', () => {
    it('should produce correct config with some sequences overriding and some inheriting', () => {
      const resolved = resolveConfig({
        global: {
          backgroundImage: 'https://example.com/global.jpg',
          backgroundOverlayOpacity: 0.6,
        },
        intro: {
          backgroundImage: 'https://example.com/intro.jpg',
          backgroundOverlayOpacity: 0.3,
        },
      })

      const state = buildInitialState(resolved, {
        global: {
          backgroundImage: 'https://example.com/global.jpg',
          backgroundOverlayOpacity: 0.6,
        },
        intro: {
          backgroundImage: 'https://example.com/intro.jpg',
          backgroundOverlayOpacity: 0.3,
        },
      })

      const config = assembleConfig(state, assembleFullTimingConfig)

      // Global has its own image
      expect(config.global?.backgroundImage).toBe('https://example.com/global.jpg')
      expect(config.global?.backgroundOverlayOpacity).toBe(0.6)

      // Intro overrides
      expect(config.intro?.backgroundImage).toBe('https://example.com/intro.jpg')
      expect(config.intro?.backgroundOverlayOpacity).toBe(0.3)

      // Other sequences inherit (null in state = null in config)
      expect(config.bookReveal?.backgroundImage).toBeNull()
      expect(config.bookReveal?.backgroundOverlayOpacity).toBeNull()
      expect(config.statsReveal?.backgroundImage).toBeNull()
      expect(config.comingSoon?.backgroundImage).toBeNull()
      expect(config.outro?.backgroundImage).toBeNull()
    })
  })

  describe('validation accepts backgroundImage: null at all levels', () => {
    it('should accept config with null backgroundImage at global and all sequence levels', () => {
      // Use real validator for this test
      const realValidate = jest.requireActual('@/lib/video/validateTemplateConfig').validateTemplateConfig

      const config = {
        global: {
          backgroundImage: null,
          backgroundOverlayOpacity: 0.7,
        },
        intro: {
          backgroundImage: null,
          backgroundOverlayOpacity: null,
        },
        bookReveal: {
          backgroundImage: null,
          backgroundOverlayOpacity: null,
        },
        statsReveal: {
          backgroundImage: null,
          backgroundOverlayOpacity: null,
        },
        comingSoon: {
          backgroundImage: null,
          backgroundOverlayOpacity: null,
        },
        outro: {
          backgroundImage: null,
          backgroundOverlayOpacity: null,
        },
      }

      const result = realValidate(config)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('presigned URL S3 key pattern', () => {
    it('should generate S3 key with correct pattern: template-backgrounds/{id}/{sequence}-{timestamp}.{ext}', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'tmpl-abc-123',
        name: 'Test',
        config: {},
      } as never)

      const req = new NextRequest('http://localhost:3000/api/templates/tmpl-abc-123/background/presigned-url', {
        method: 'POST',
        body: JSON.stringify({
          contentType: 'image/png',
          fileSize: 1000,
          sequence: 'intro',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await presignedUrlPOST(req, makeParams('tmpl-abc-123'))
      expect(response.status).toBe(200)

      const data = await response.json()
      // Key should match pattern: template-backgrounds/tmpl-abc-123/intro-{timestamp}.png
      expect(data.key).toMatch(/^template-backgrounds\/tmpl-abc-123\/intro-\d+\.png$/)
      expect(data.publicUrl).toContain('template-backgrounds/tmpl-abc-123/intro-')
    })
  })

  describe('background processing endpoint returns 404 for missing template', () => {
    it('should return 404 when template does not exist', async () => {
      mockFindUnique.mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/templates/nonexistent-id/background', {
        method: 'POST',
        body: JSON.stringify({
          key: 'template-backgrounds/nonexistent-id/global-123.jpg',
          sequence: 'global',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await backgroundPOST(req, makeParams('nonexistent-id'))
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('Template not found')
    })
  })

  describe('resolveConfig global-to-sequence fallback', () => {
    it('should inherit global background to all sequences when no sequence overrides exist', () => {
      const config: VideoTemplate = {
        global: {
          backgroundImage: 'https://example.com/global-bg.jpg',
          backgroundOverlayOpacity: 0.5,
        },
      }

      const resolved = resolveConfig(config)

      // Global values
      expect(resolved.global.backgroundImage).toBe('https://example.com/global-bg.jpg')
      expect(resolved.global.backgroundOverlayOpacity).toBe(0.5)

      // All sequences inherit
      const sequences = ['intro', 'bookReveal', 'statsReveal', 'comingSoon', 'outro'] as const
      for (const seq of sequences) {
        expect(resolved[seq].backgroundImage).toBe('https://example.com/global-bg.jpg')
        expect(resolved[seq].backgroundOverlayOpacity).toBe(0.5)
      }
    })
  })
})
