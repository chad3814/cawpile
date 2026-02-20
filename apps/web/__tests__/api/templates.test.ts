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
import { logAdminAction } from '@/lib/audit/logger'

// Import the route handlers
import { GET, POST } from '@/app/api/templates/route'
import {
  GET as GET_BY_ID,
  PATCH,
  DELETE,
} from '@/app/api/templates/[id]/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockLogAdminAction = logAdminAction as jest.MockedFunction<typeof logAdminAction>

describe('Templates API Endpoints', () => {
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
    mockLogAdminAction.mockResolvedValue(undefined)
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

  describe('Authentication', () => {
    test('should return 401 for unauthenticated requests', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    test('should return 401 for non-admin users', async () => {
      mockGetCurrentUser.mockResolvedValue({
        ...testAdminUser,
        isAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', config: {} }),
        headers: { 'Content-Type': 'application/json' },
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/templates', () => {
    test('should return all templates ordered by createdAt desc', async () => {
      // Create test templates with delays
      const template1 = await prisma.videoTemplate.create({
        data: {
          name: `API Test Template 1 ${nanoid(6)}`,
          config: { order: 1 },
        },
      })
      createdTemplateIds.push(template1.id)

      await new Promise((resolve) => setTimeout(resolve, 50))

      const template2 = await prisma.videoTemplate.create({
        data: {
          name: `API Test Template 2 ${nanoid(6)}`,
          config: { order: 2 },
        },
      })
      createdTemplateIds.push(template2.id)

      const request = new NextRequest('http://localhost:3000/api/templates')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.templates).toBeDefined()
      expect(Array.isArray(data.templates)).toBe(true)

      // Find our templates in the response
      const ourTemplates = data.templates.filter((t: { id: string }) =>
        [template1.id, template2.id].includes(t.id)
      )
      expect(ourTemplates).toHaveLength(2)

      // Should be ordered newest first
      const template2Index = data.templates.findIndex((t: { id: string }) => t.id === template2.id)
      const template1Index = data.templates.findIndex((t: { id: string }) => t.id === template1.id)
      expect(template2Index).toBeLessThan(template1Index)

      // Verify cache header
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=60')
    })

    test('should support pagination with limit and offset', async () => {
      // Create 3 templates
      for (let i = 0; i < 3; i++) {
        const template = await prisma.videoTemplate.create({
          data: {
            name: `Pagination Test ${i} ${nanoid(6)}`,
            config: { index: i },
          },
        })
        createdTemplateIds.push(template.id)
        await new Promise((resolve) => setTimeout(resolve, 20))
      }

      // Test with limit
      const limitRequest = new NextRequest('http://localhost:3000/api/templates?limit=2')
      const limitResponse = await GET(limitRequest)
      const limitData = await limitResponse.json()

      expect(limitResponse.status).toBe(200)
      expect(limitData.templates.length).toBeLessThanOrEqual(2)

      // Test with offset
      const offsetRequest = new NextRequest('http://localhost:3000/api/templates?limit=1&offset=1')
      const offsetResponse = await GET(offsetRequest)
      const offsetData = await offsetResponse.json()

      expect(offsetResponse.status).toBe(200)
      expect(offsetData.templates.length).toBeLessThanOrEqual(1)
    })
  })

  describe('GET /api/templates/[id]', () => {
    test('should return a single template by ID', async () => {
      const template = await prisma.videoTemplate.create({
        data: {
          name: `Single Template Test ${nanoid(6)}`,
          description: 'Test description',
          config: { test: true },
        },
      })
      createdTemplateIds.push(template.id)

      const request = new NextRequest(`http://localhost:3000/api/templates/${template.id}`)
      const params = Promise.resolve({ id: template.id })

      const response = await GET_BY_ID(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.template).toBeDefined()
      expect(data.template.id).toBe(template.id)
      expect(data.template.name).toContain('Single Template Test')
      expect(data.template.description).toBe('Test description')
      expect(data.template.config).toEqual({ test: true })

      // Verify cache header
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=60')
    })

    test('should return 404 for non-existent template', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates/non-existent-id')
      const params = Promise.resolve({ id: 'non-existent-id' })

      const response = await GET_BY_ID(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBeDefined()
    })
  })

  describe('POST /api/templates', () => {
    test('should create a template with valid config', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: `Create Test ${nanoid(6)}`,
          description: 'Created via API',
          config: {
            intro: { layout: 'minimal' },
            bookReveal: { coverSize: 'large' },
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.template).toBeDefined()
      expect(data.template.id).toBeDefined()
      expect(data.template.name).toContain('Create Test')
      expect(data.template.description).toBe('Created via API')
      expect(data.template.config).toEqual({
        intro: { layout: 'minimal' },
        bookReveal: { coverSize: 'large' },
      })

      createdTemplateIds.push(data.template.id)
    })

    test('should log audit entry on create', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: `Audit Test ${nanoid(6)}`,
          config: {},
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      createdTemplateIds.push(data.template.id)

      expect(mockLogAdminAction).toHaveBeenCalledWith(testAdminUser.id, {
        entityType: 'VideoTemplate',
        entityId: data.template.id,
        actionType: 'CREATE',
        newValue: { name: data.template.name, isPublished: false },
      })
    })

    test('should return 400 with validation errors for invalid config', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: `Invalid Config Test ${nanoid(6)}`,
          config: {
            intro: { layout: 'invalid-layout' },
            unknownProperty: 'value',
          },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
      expect(data.validationErrors).toBeDefined()
      expect(Array.isArray(data.validationErrors)).toBe(true)
      expect(data.validationErrors.length).toBeGreaterThan(0)
    })

    test('should return 400 if name is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          config: { intro: { layout: 'minimal' } },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('PATCH /api/templates/[id]', () => {
    test('should update a template partially', async () => {
      const template = await prisma.videoTemplate.create({
        data: {
          name: `Update Test ${nanoid(6)}`,
          description: 'Original description',
          config: { original: true },
        },
      })
      createdTemplateIds.push(template.id)

      const request = new NextRequest(`http://localhost:3000/api/templates/${template.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Updated description',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const params = Promise.resolve({ id: template.id })

      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.template).toBeDefined()
      expect(data.template.description).toBe('Updated description')
      expect(data.template.name).toContain('Update Test') // Unchanged
      expect(data.template.config).toEqual({ original: true }) // Unchanged
    })

    test('should validate config on update', async () => {
      const template = await prisma.videoTemplate.create({
        data: {
          name: `Config Update Test ${nanoid(6)}`,
          config: { valid: true },
        },
      })
      createdTemplateIds.push(template.id)

      const request = new NextRequest(`http://localhost:3000/api/templates/${template.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          config: { intro: { layout: 'invalid-layout' } },
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const params = Promise.resolve({ id: template.id })

      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
      expect(data.validationErrors).toBeDefined()
    })
  })

  describe('DELETE /api/templates/[id]', () => {
    test('should delete a template and log audit entry', async () => {
      const template = await prisma.videoTemplate.create({
        data: {
          name: `Delete Test ${nanoid(6)}`,
          config: { toDelete: true },
        },
      })
      // Don't add to createdTemplateIds - we're deleting it

      const request = new NextRequest(`http://localhost:3000/api/templates/${template.id}`, {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: template.id })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBeDefined()

      // Verify it's actually deleted
      const found = await prisma.videoTemplate.findUnique({
        where: { id: template.id },
      })
      expect(found).toBeNull()

      // Verify audit log was called
      expect(mockLogAdminAction).toHaveBeenCalledWith(testAdminUser.id, {
        entityType: 'VideoTemplate',
        entityId: template.id,
        actionType: 'DELETE',
        oldValue: { name: template.name },
      })
    })

    test('should return 404 when deleting non-existent template', async () => {
      const request = new NextRequest('http://localhost:3000/api/templates/non-existent-id', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: 'non-existent-id' })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBeDefined()
    })
  })
})
