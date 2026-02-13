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
import { logAdminAction, logFieldChanges } from '@/lib/audit/logger'

// Import the route handlers
import { GET, POST } from '@/app/api/templates/route'
import { PATCH } from '@/app/api/templates/[id]/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockLogAdminAction = logAdminAction as jest.MockedFunction<typeof logAdminAction>
const mockLogFieldChanges = logFieldChanges as jest.MockedFunction<typeof logFieldChanges>

describe('Templates API - Extended Fields', () => {
  const createdTemplateIds: string[] = []
  const createdUserIds: string[] = []
  const testAdminUser = {
    id: 'test-admin-extended-id',
    email: 'admin-extended@test.com',
    name: 'Test Admin Extended',
    isAdmin: true,
    isSuperAdmin: false,
  }

  beforeAll(async () => {
    // Create the admin user in the database so userId FK works
    await prisma.user.upsert({
      where: { email: testAdminUser.email },
      update: {},
      create: {
        id: testAdminUser.id,
        email: testAdminUser.email,
        name: testAdminUser.name,
        isAdmin: true,
      },
    })
    createdUserIds.push(testAdminUser.id)
  })

  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue(testAdminUser)
    mockLogAdminAction.mockResolvedValue(undefined)
    mockLogFieldChanges.mockResolvedValue(undefined)
  })

  afterAll(async () => {
    // Clean up templates first (due to FK)
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
    }
    // Clean up users
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      })
    }
    await prisma.$disconnect()
  })

  afterEach(async () => {
    jest.clearAllMocks()
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
      createdTemplateIds.length = 0
    }
  })

  test('GET /api/templates returns templates with creator info (name, image) included', async () => {
    // Create a template with the admin as creator
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Creator Info Test ${nanoid(6)}`,
        config: {},
        userId: testAdminUser.id,
        isPublished: true,
      },
    })
    createdTemplateIds.push(template.id)

    const request = new NextRequest('http://localhost:3000/api/templates')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.templates).toBeDefined()

    const ourTemplate = data.templates.find((t: { id: string }) => t.id === template.id)
    expect(ourTemplate).toBeDefined()
    expect(ourTemplate.creator).toBeDefined()
    expect(ourTemplate.creator.name).toBe(testAdminUser.name)
  })

  test('GET /api/templates supports isPublished query parameter filtering', async () => {
    // Create a published template
    const publishedTemplate = await prisma.videoTemplate.create({
      data: {
        name: `Published Filter Test ${nanoid(6)}`,
        config: {},
        isPublished: true,
      },
    })
    createdTemplateIds.push(publishedTemplate.id)

    // Create an unpublished template
    const unpublishedTemplate = await prisma.videoTemplate.create({
      data: {
        name: `Unpublished Filter Test ${nanoid(6)}`,
        config: {},
        isPublished: false,
      },
    })
    createdTemplateIds.push(unpublishedTemplate.id)

    // Filter for published only
    const publishedRequest = new NextRequest('http://localhost:3000/api/templates?isPublished=true')
    const publishedResponse = await GET(publishedRequest)
    const publishedData = await publishedResponse.json()

    expect(publishedResponse.status).toBe(200)
    const publishedIds = publishedData.templates.map((t: { id: string }) => t.id)
    expect(publishedIds).toContain(publishedTemplate.id)
    expect(publishedIds).not.toContain(unpublishedTemplate.id)

    // Filter for unpublished only
    const unpublishedRequest = new NextRequest('http://localhost:3000/api/templates?isPublished=false')
    const unpublishedResponse = await GET(unpublishedRequest)
    const unpublishedData = await unpublishedResponse.json()

    expect(unpublishedResponse.status).toBe(200)
    const unpublishedIds = unpublishedData.templates.map((t: { id: string }) => t.id)
    expect(unpublishedIds).toContain(unpublishedTemplate.id)
    expect(unpublishedIds).not.toContain(publishedTemplate.id)

    // No filter returns all
    const allRequest = new NextRequest('http://localhost:3000/api/templates')
    const allResponse = await GET(allRequest)
    const allData = await allResponse.json()

    const allIds = allData.templates.map((t: { id: string }) => t.id)
    expect(allIds).toContain(publishedTemplate.id)
    expect(allIds).toContain(unpublishedTemplate.id)
  })

  test('POST /api/templates auto-sets userId to the creating admin ID and accepts isPublished', async () => {
    const request = new NextRequest('http://localhost:3000/api/templates', {
      method: 'POST',
      body: JSON.stringify({
        name: `Auto UserId Test ${nanoid(6)}`,
        config: {},
        isPublished: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.template).toBeDefined()
    expect(data.template.userId).toBe(testAdminUser.id)
    expect(data.template.isPublished).toBe(true)

    createdTemplateIds.push(data.template.id)

    // Verify audit log includes isPublished
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      testAdminUser.id,
      expect.objectContaining({
        entityType: 'VideoTemplate',
        actionType: 'CREATE',
        newValue: expect.objectContaining({
          isPublished: true,
        }),
      })
    )
  })

  test('PATCH /api/templates/[id] accepts and persists isPublished field changes', async () => {
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Publish Toggle Test ${nanoid(6)}`,
        config: {},
        isPublished: false,
      },
    })
    createdTemplateIds.push(template.id)

    const request = new NextRequest(`http://localhost:3000/api/templates/${template.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        isPublished: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const params = Promise.resolve({ id: template.id })

    const response = await PATCH(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.template.isPublished).toBe(true)

    // Verify in database
    const updated = await prisma.videoTemplate.findUnique({ where: { id: template.id } })
    expect(updated?.isPublished).toBe(true)
  })

  test('PATCH /api/templates/[id] audit logs isPublished changes via logFieldChanges', async () => {
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Audit Publish Test ${nanoid(6)}`,
        config: {},
        isPublished: false,
      },
    })
    createdTemplateIds.push(template.id)

    const request = new NextRequest(`http://localhost:3000/api/templates/${template.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        isPublished: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const params = Promise.resolve({ id: template.id })

    await PATCH(request, { params })

    expect(mockLogFieldChanges).toHaveBeenCalledWith(
      testAdminUser.id,
      'VideoTemplate',
      template.id,
      expect.objectContaining({
        isPublished: { old: false, new: true },
      })
    )
  })
})
