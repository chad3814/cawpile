/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// Mock the auth helpers (user-facing routes use auth-helpers, not auth/admin)
jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}))

// Mock validateTemplateConfig for the duplicate route
jest.mock('@/lib/video/validateTemplateConfig', () => ({
  validateTemplateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] }),
}))

import { getCurrentUser } from '@/lib/auth-helpers'

// Import the route handlers
import { GET as GET_BROWSE } from '@/app/api/user/templates/route'
import { GET as GET_DETAIL } from '@/app/api/user/templates/[id]/route'
import { POST as POST_SELECT } from '@/app/api/user/templates/[id]/select/route'
import { POST as POST_DUPLICATE } from '@/app/api/user/templates/[id]/duplicate/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe('User Templates API Endpoints', () => {
  const createdTemplateIds: string[] = []
  const createdUserIds: string[] = []

  // Test user (regular, non-admin)
  let testUser: { id: string; email: string; name: string; isAdmin: boolean; isSuperAdmin: boolean }

  beforeAll(async () => {
    // Create a real test user in the database
    const user = await prisma.user.create({
      data: {
        email: `user-templates-test-${nanoid(6)}@test.com`,
        name: 'Template Test User',
      },
    })
    createdUserIds.push(user.id)
    testUser = {
      id: user.id,
      email: user.email,
      name: user.name!,
      isAdmin: false,
      isSuperAdmin: false,
    }
  })

  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue(testUser)
  })

  afterAll(async () => {
    // Clean up templates first
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
    }
    // Clean up users
    if (createdUserIds.length > 0) {
      // First clear selectedTemplateId to avoid FK issues
      await prisma.user.updateMany({
        where: { id: { in: createdUserIds } },
        data: { selectedTemplateId: null },
      })
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      })
    }
    await prisma.$disconnect()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    // Reset user's selectedTemplateId
    if (testUser) {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { selectedTemplateId: null },
      }).catch(() => {})
    }
    // Clean up templates created during each test
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
      createdTemplateIds.length = 0
    }
  })

  describe('GET /api/user/templates (browse)', () => {
    test('returns only published templates (never unpublished)', async () => {
      // Create a published template
      const published = await prisma.videoTemplate.create({
        data: {
          name: `Published Browse ${nanoid(6)}`,
          config: {},
          isPublished: true,
        },
      })
      createdTemplateIds.push(published.id)

      // Create an unpublished template
      const unpublished = await prisma.videoTemplate.create({
        data: {
          name: `Unpublished Browse ${nanoid(6)}`,
          config: {},
          isPublished: false,
        },
      })
      createdTemplateIds.push(unpublished.id)

      const request = new NextRequest('http://localhost:3000/api/user/templates')
      const response = await GET_BROWSE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.templates).toBeDefined()
      const templateIds = data.templates.map((t: { id: string }) => t.id)
      expect(templateIds).toContain(published.id)
      expect(templateIds).not.toContain(unpublished.id)
    })

    test('supports pagination with limit and offset parameters', async () => {
      // Create 5 published templates
      for (let i = 0; i < 5; i++) {
        const template = await prisma.videoTemplate.create({
          data: {
            name: `Pagination User ${i} ${nanoid(6)}`,
            config: {},
            isPublished: true,
          },
        })
        createdTemplateIds.push(template.id)
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      // Test limit
      const limitRequest = new NextRequest('http://localhost:3000/api/user/templates?limit=2')
      const limitResponse = await GET_BROWSE(limitRequest)
      const limitData = await limitResponse.json()

      expect(limitResponse.status).toBe(200)
      expect(limitData.templates.length).toBeLessThanOrEqual(2)
      expect(limitData.totalCount).toBeGreaterThanOrEqual(5)

      // Test offset
      const offsetRequest = new NextRequest('http://localhost:3000/api/user/templates?limit=2&offset=2')
      const offsetResponse = await GET_BROWSE(offsetRequest)
      const offsetData = await offsetResponse.json()

      expect(offsetResponse.status).toBe(200)
      expect(offsetData.templates.length).toBeLessThanOrEqual(2)
    })

    test('supports sorting by newest, name, and popular', async () => {
      // Create templates with different names and usage counts
      const templateA = await prisma.videoTemplate.create({
        data: {
          name: `AAA Sort Test ${nanoid(6)}`,
          config: {},
          isPublished: true,
          usageCount: 5,
        },
      })
      createdTemplateIds.push(templateA.id)

      await new Promise((resolve) => setTimeout(resolve, 50))

      const templateZ = await prisma.videoTemplate.create({
        data: {
          name: `ZZZ Sort Test ${nanoid(6)}`,
          config: {},
          isPublished: true,
          usageCount: 100,
        },
      })
      createdTemplateIds.push(templateZ.id)

      // Test sort by newest (default)
      const newestRequest = new NextRequest('http://localhost:3000/api/user/templates?sort=newest')
      const newestResponse = await GET_BROWSE(newestRequest)
      const newestData = await newestResponse.json()

      expect(newestResponse.status).toBe(200)
      const newestIds = newestData.templates.map((t: { id: string }) => t.id)
      const zIdx = newestIds.indexOf(templateZ.id)
      const aIdx = newestIds.indexOf(templateA.id)
      if (zIdx !== -1 && aIdx !== -1) {
        expect(zIdx).toBeLessThan(aIdx) // Newer (templateZ) comes first
      }

      // Test sort by name
      const nameRequest = new NextRequest('http://localhost:3000/api/user/templates?sort=name')
      const nameResponse = await GET_BROWSE(nameRequest)
      const nameData = await nameResponse.json()

      expect(nameResponse.status).toBe(200)
      const nameIds = nameData.templates.map((t: { id: string }) => t.id)
      const zIdxName = nameIds.indexOf(templateZ.id)
      const aIdxName = nameIds.indexOf(templateA.id)
      if (zIdxName !== -1 && aIdxName !== -1) {
        expect(aIdxName).toBeLessThan(zIdxName) // AAA comes before ZZZ alphabetically
      }

      // Test sort by popular
      const popularRequest = new NextRequest('http://localhost:3000/api/user/templates?sort=popular')
      const popularResponse = await GET_BROWSE(popularRequest)
      const popularData = await popularResponse.json()

      expect(popularResponse.status).toBe(200)
      const popularIds = popularData.templates.map((t: { id: string }) => t.id)
      const zIdxPop = popularIds.indexOf(templateZ.id)
      const aIdxPop = popularIds.indexOf(templateA.id)
      if (zIdxPop !== -1 && aIdxPop !== -1) {
        expect(zIdxPop).toBeLessThan(aIdxPop) // Higher usageCount (100) comes first
      }
    })

    test('supports search filtering by template name (case-insensitive)', async () => {
      const uniqueName = `UniqueSearchable ${nanoid(8)}`
      const searchable = await prisma.videoTemplate.create({
        data: {
          name: uniqueName,
          config: {},
          isPublished: true,
        },
      })
      createdTemplateIds.push(searchable.id)

      const other = await prisma.videoTemplate.create({
        data: {
          name: `Other Template ${nanoid(6)}`,
          config: {},
          isPublished: true,
        },
      })
      createdTemplateIds.push(other.id)

      // Search with lowercase version of name
      const searchTerm = uniqueName.toLowerCase().substring(0, 16)
      const request = new NextRequest(`http://localhost:3000/api/user/templates?search=${encodeURIComponent(searchTerm)}`)
      const response = await GET_BROWSE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const templateIds = data.templates.map((t: { id: string }) => t.id)
      expect(templateIds).toContain(searchable.id)
    })
  })

  describe('GET /api/user/templates/[id] (detail)', () => {
    test('returns 404 for unpublished or nonexistent templates', async () => {
      // Test nonexistent
      const nonexistentRequest = new NextRequest('http://localhost:3000/api/user/templates/nonexistent-id')
      const nonexistentParams = Promise.resolve({ id: 'nonexistent-id' })
      const nonexistentResponse = await GET_DETAIL(nonexistentRequest, { params: nonexistentParams })
      expect(nonexistentResponse.status).toBe(404)

      // Test unpublished
      const unpublished = await prisma.videoTemplate.create({
        data: {
          name: `Unpublished Detail ${nanoid(6)}`,
          config: {},
          isPublished: false,
        },
      })
      createdTemplateIds.push(unpublished.id)

      const unpublishedRequest = new NextRequest(`http://localhost:3000/api/user/templates/${unpublished.id}`)
      const unpublishedParams = Promise.resolve({ id: unpublished.id })
      const unpublishedResponse = await GET_DETAIL(unpublishedRequest, { params: unpublishedParams })
      expect(unpublishedResponse.status).toBe(404)
    })
  })

  describe('POST /api/user/templates/[id]/select', () => {
    test('sets user selectedTemplateId and increments usageCount', async () => {
      const template = await prisma.videoTemplate.create({
        data: {
          name: `Select Test ${nanoid(6)}`,
          config: {},
          isPublished: true,
          usageCount: 0,
        },
      })
      createdTemplateIds.push(template.id)

      const request = new NextRequest(`http://localhost:3000/api/user/templates/${template.id}/select`, {
        method: 'POST',
      })
      const params = Promise.resolve({ id: template.id })

      const response = await POST_SELECT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.selectedTemplateId).toBe(template.id)

      // Verify in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: { selectedTemplateId: true },
      })
      expect(updatedUser?.selectedTemplateId).toBe(template.id)

      // Verify usageCount was incremented
      const updatedTemplate = await prisma.videoTemplate.findUnique({
        where: { id: template.id },
        select: { usageCount: true },
      })
      expect(updatedTemplate?.usageCount).toBe(1)
    })

    test('is idempotent (does not double-increment usageCount on re-select)', async () => {
      const template = await prisma.videoTemplate.create({
        data: {
          name: `Idempotent Select ${nanoid(6)}`,
          config: {},
          isPublished: true,
          usageCount: 10,
        },
      })
      createdTemplateIds.push(template.id)

      // First select
      const request1 = new NextRequest(`http://localhost:3000/api/user/templates/${template.id}/select`, {
        method: 'POST',
      })
      const params1 = Promise.resolve({ id: template.id })
      const response1 = await POST_SELECT(request1, { params: params1 })
      expect(response1.status).toBe(200)

      // Second select (same template)
      const request2 = new NextRequest(`http://localhost:3000/api/user/templates/${template.id}/select`, {
        method: 'POST',
      })
      const params2 = Promise.resolve({ id: template.id })
      const response2 = await POST_SELECT(request2, { params: params2 })
      expect(response2.status).toBe(200)

      // Verify usageCount was only incremented once
      const updatedTemplate = await prisma.videoTemplate.findUnique({
        where: { id: template.id },
        select: { usageCount: true },
      })
      expect(updatedTemplate?.usageCount).toBe(11) // 10 + 1 (not 10 + 2)
    })
  })

  describe('POST /api/user/templates/[id]/duplicate', () => {
    test('creates a personal copy with correct fields', async () => {
      const source = await prisma.videoTemplate.create({
        data: {
          name: `Source Template ${nanoid(6)}`,
          description: 'Original description',
          previewThumbnailUrl: 'https://example.com/preview.jpg',
          config: {
            global: {
              colors: { accent: '#ff0000' },
              fonts: { heading: 'Inter' },
            },
            intro: { layout: 'centered' },
          },
          isPublished: true,
          usageCount: 50,
        },
      })
      createdTemplateIds.push(source.id)

      const request = new NextRequest(`http://localhost:3000/api/user/templates/${source.id}/duplicate`, {
        method: 'POST',
      })
      const params = Promise.resolve({ id: source.id })

      const response = await POST_DUPLICATE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.template).toBeDefined()
      createdTemplateIds.push(data.template.id)

      // Verify the duplicate has correct fields
      expect(data.template.name).toBe(`Copy of ${source.name}`)
      expect(data.template.description).toBe('Original description')
      expect(data.template.previewThumbnailUrl).toBe('https://example.com/preview.jpg')
      expect(data.template.userId).toBe(testUser.id)
      expect(data.template.isPublished).toBe(false)
      expect(data.template.usageCount).toBe(0)

      // Verify config is a deep copy
      expect(data.template.config).toEqual(source.config)

      // Verify it's a separate record
      expect(data.template.id).not.toBe(source.id)
    })
  })
})
