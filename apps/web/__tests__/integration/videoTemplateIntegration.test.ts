/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// Mock the auth helpers
jest.mock('@/lib/auth/admin', () => ({
  getCurrentUser: jest.fn(),
}))

// Mock the audit logger
jest.mock('@/lib/audit/logger', () => ({
  logAdminAction: jest.fn(),
  logFieldChanges: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth/admin'

// Import the route handlers
import { GET, POST } from '@/app/api/templates/route'
import {
  GET as GET_BY_ID,
  PATCH,
} from '@/app/api/templates/[id]/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe('VideoTemplate Integration Tests', () => {
  const createdTemplateIds: string[] = []
  const testAdminUser = {
    id: 'test-admin-id',
    email: 'admin@test.com',
    name: 'Test Admin',
    isAdmin: true,
    isSuperAdmin: false,
  }

  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue(testAdminUser)
  })

  afterAll(async () => {
    // Clean up all test templates
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
    }
    await prisma.$disconnect()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    // Clean up templates created during each test
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
      createdTemplateIds.length = 0
    }
  })

  describe('Create and Retrieve Workflow', () => {
    test('should create a template via POST and retrieve it via GET by ID', async () => {
      // Step 1: Create template via POST
      const createRequest = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: `Integration Test ${nanoid(6)}`,
          description: 'Created for integration test',
          config: {
            intro: { layout: 'split', titleFontSize: 80 },
            bookReveal: { layout: 'grid', coverSize: 'medium' },
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const createResponse = await POST(createRequest)
      const createData = await createResponse.json()

      expect(createResponse.status).toBe(201)
      expect(createData.template.id).toBeDefined()
      createdTemplateIds.push(createData.template.id)

      // Step 2: Retrieve template via GET by ID
      const getRequest = new NextRequest(`http://localhost:3000/api/templates/${createData.template.id}`)
      const params = Promise.resolve({ id: createData.template.id })

      const getResponse = await GET_BY_ID(getRequest, { params })
      const getData = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(getData.template.id).toBe(createData.template.id)
      expect(getData.template.name).toBe(createData.template.name)
      expect(getData.template.description).toBe('Created for integration test')
      expect(getData.template.config).toEqual({
        intro: { layout: 'split', titleFontSize: 80 },
        bookReveal: { layout: 'grid', coverSize: 'medium' },
      })
    })
  })

  describe('Update Workflow with Valid Config', () => {
    test('should update template config with valid values via PATCH', async () => {
      // Create initial template
      const template = await prisma.videoTemplate.create({
        data: {
          name: `Config Update Test ${nanoid(6)}`,
          config: {
            intro: { layout: 'centered' },
          },
        },
      })
      createdTemplateIds.push(template.id)

      // Update with valid config
      const patchRequest = new NextRequest(`http://localhost:3000/api/templates/${template.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          config: {
            intro: { layout: 'minimal', titleFontSize: 96 },
            statsReveal: { layout: 'horizontal', animateNumbers: false },
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const params = Promise.resolve({ id: template.id })

      const patchResponse = await PATCH(patchRequest, { params })
      const patchData = await patchResponse.json()

      expect(patchResponse.status).toBe(200)
      expect(patchData.template.config).toEqual({
        intro: { layout: 'minimal', titleFontSize: 96 },
        statsReveal: { layout: 'horizontal', animateNumbers: false },
      })
    })
  })

  describe('Edge Cases', () => {
    test('should create template with minimal valid config (empty object {})', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: `Minimal Config Test ${nanoid(6)}`,
          config: {},
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.template.config).toEqual({})
      createdTemplateIds.push(data.template.id)
    })

    test('should return 400 when config is missing from POST', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: `Missing Config Test ${nanoid(6)}`,
          // No config field
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
      expect(data.error).toContain('Config is required')
    })

    test('should handle pagination with limit larger than total templates', async () => {
      // Create exactly 2 templates
      for (let i = 0; i < 2; i++) {
        const template = await prisma.videoTemplate.create({
          data: {
            name: `Pagination Edge Test ${i} ${nanoid(6)}`,
            config: { index: i },
          },
        })
        createdTemplateIds.push(template.id)
      }

      // Request with limit = 100 (larger than 2)
      const request = new NextRequest('http://localhost:3000/api/templates?limit=100')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data.templates)).toBe(true)
      // Should return all templates (at least 2, might include others in DB)
      const ourTemplates = data.templates.filter((t: { id: string }) =>
        createdTemplateIds.includes(t.id)
      )
      expect(ourTemplates).toHaveLength(2)
    })

    test('should update only name without triggering config validation', async () => {
      // Create template with specific config
      const template = await prisma.videoTemplate.create({
        data: {
          name: `Name Only Update ${nanoid(6)}`,
          description: 'Original',
          config: { intro: { layout: 'centered' } },
        },
      })
      createdTemplateIds.push(template.id)

      // Update only the name
      const request = new NextRequest(`http://localhost:3000/api/templates/${template.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Name Only',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const params = Promise.resolve({ id: template.id })

      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.template.name).toBe('Updated Name Only')
      expect(data.template.description).toBe('Original') // Unchanged
      expect(data.template.config).toEqual({ intro: { layout: 'centered' } }) // Unchanged
    })

    test('should update previewThumbnailUrl field', async () => {
      const template = await prisma.videoTemplate.create({
        data: {
          name: `Thumbnail Update ${nanoid(6)}`,
          config: {},
        },
      })
      createdTemplateIds.push(template.id)

      const request = new NextRequest(`http://localhost:3000/api/templates/${template.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          previewThumbnailUrl: 'https://example.com/new-thumbnail.jpg',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const params = Promise.resolve({ id: template.id })

      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.template.previewThumbnailUrl).toBe('https://example.com/new-thumbnail.jpg')
    })
  })
})
