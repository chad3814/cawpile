/**
 * @jest-environment node
 */
/**
 * Integration and gap-filling tests for the Template Repository feature
 * Task Group 6.3: Strategic tests to fill coverage gaps
 *
 * Tests cover:
 * - Full user flows (browse -> select -> verify, browse -> duplicate -> verify)
 * - Authentication enforcement across user API routes
 * - Edge cases for select and duplicate endpoints
 * - UI component edge cases
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// Mock the auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}))

// Mock validateTemplateConfig for the duplicate route
jest.mock('@/lib/video/validateTemplateConfig', () => ({
  validateTemplateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] }),
}))

import { getCurrentUser } from '@/lib/auth-helpers'
import { validateTemplateConfig } from '@/lib/video/validateTemplateConfig'

// Import the route handlers
import { GET as GET_BROWSE } from '@/app/api/user/templates/route'
import { GET as GET_DETAIL } from '@/app/api/user/templates/[id]/route'
import { POST as POST_SELECT } from '@/app/api/user/templates/[id]/select/route'
import { POST as POST_DUPLICATE } from '@/app/api/user/templates/[id]/duplicate/route'
import { GET as GET_MINE } from '@/app/api/user/templates/mine/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockValidateTemplateConfig = validateTemplateConfig as jest.MockedFunction<typeof validateTemplateConfig>

describe('Template Repository - Integration & Gap Tests', () => {
  const createdTemplateIds: string[] = []
  const createdUserIds: string[] = []

  let testUser: { id: string; email: string; name: string; isAdmin: boolean; isSuperAdmin: boolean }

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `integration-tmpl-${nanoid(6)}@test.com`,
        name: 'Integration Test User',
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
    mockValidateTemplateConfig.mockReturnValue({ valid: true, errors: [] })
  })

  afterAll(async () => {
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
    }
    if (createdUserIds.length > 0) {
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
    if (testUser) {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { selectedTemplateId: null },
      }).catch(() => {})
    }
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
      createdTemplateIds.length = 0
    }
  })

  test('full user flow: browse, select, and verify selection persists', async () => {
    // Create a published template
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Integration Flow Template ${nanoid(6)}`,
        config: { global: { colors: { accent: '#ff0000' } } },
        isPublished: true,
        usageCount: 0,
      },
    })
    createdTemplateIds.push(template.id)

    // Step 1: Browse templates
    const browseRequest = new NextRequest('http://localhost:3000/api/user/templates')
    const browseResponse = await GET_BROWSE(browseRequest)
    const browseData = await browseResponse.json()

    expect(browseResponse.status).toBe(200)
    const found = browseData.templates.find((t: { id: string }) => t.id === template.id)
    expect(found).toBeDefined()
    expect(browseData.selectedTemplateId).toBeNull()

    // Step 2: Select the template
    const selectRequest = new NextRequest(`http://localhost:3000/api/user/templates/${template.id}/select`, {
      method: 'POST',
    })
    const selectParams = Promise.resolve({ id: template.id })
    const selectResponse = await POST_SELECT(selectRequest, { params: selectParams })
    const selectData = await selectResponse.json()

    expect(selectResponse.status).toBe(200)
    expect(selectData.success).toBe(true)
    expect(selectData.selectedTemplateId).toBe(template.id)

    // Step 3: Verify selection persists by browsing again
    const verifyRequest = new NextRequest('http://localhost:3000/api/user/templates')
    const verifyResponse = await GET_BROWSE(verifyRequest)
    const verifyData = await verifyResponse.json()

    expect(verifyResponse.status).toBe(200)
    expect(verifyData.selectedTemplateId).toBe(template.id)
  })

  test('full duplicate flow: create personal copy and verify it appears in mine', async () => {
    const source = await prisma.videoTemplate.create({
      data: {
        name: `Duplicatable Source ${nanoid(6)}`,
        description: 'Source for duplication test',
        config: {
          global: { colors: { accent: '#00ff00' }, fonts: { heading: 'Arial' } },
          intro: { layout: 'centered' },
        },
        isPublished: true,
      },
    })
    createdTemplateIds.push(source.id)

    // Step 1: Duplicate the template
    const dupRequest = new NextRequest(`http://localhost:3000/api/user/templates/${source.id}/duplicate`, {
      method: 'POST',
    })
    const dupParams = Promise.resolve({ id: source.id })
    const dupResponse = await POST_DUPLICATE(dupRequest, { params: dupParams })
    const dupData = await dupResponse.json()

    expect(dupResponse.status).toBe(201)
    expect(dupData.template.name).toBe(`Copy of ${source.name}`)
    expect(dupData.template.userId).toBe(testUser.id)
    expect(dupData.template.isPublished).toBe(false)
    createdTemplateIds.push(dupData.template.id)

    // Step 2: Verify it appears in user's personal templates
    const mineRequest = new NextRequest('http://localhost:3000/api/user/templates/mine')
    const mineResponse = await GET_MINE(mineRequest)
    const mineData = await mineResponse.json()

    expect(mineResponse.status).toBe(200)
    const myCopy = mineData.templates.find((t: { id: string }) => t.id === dupData.template.id)
    expect(myCopy).toBeDefined()
    expect(myCopy.name).toBe(`Copy of ${source.name}`)

    // Step 3: Verify the personal copy does NOT appear in public browse
    const browseRequest = new NextRequest('http://localhost:3000/api/user/templates')
    const browseResponse = await GET_BROWSE(browseRequest)
    const browseData = await browseResponse.json()

    const publicIds = browseData.templates.map((t: { id: string }) => t.id)
    expect(publicIds).not.toContain(dupData.template.id)
  })

  test('unauthenticated access to user template API routes returns 401', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    // Browse
    const browseRequest = new NextRequest('http://localhost:3000/api/user/templates')
    const browseResponse = await GET_BROWSE(browseRequest)
    expect(browseResponse.status).toBe(401)

    // Detail
    const detailRequest = new NextRequest('http://localhost:3000/api/user/templates/some-id')
    const detailParams = Promise.resolve({ id: 'some-id' })
    const detailResponse = await GET_DETAIL(detailRequest, { params: detailParams })
    expect(detailResponse.status).toBe(401)

    // Select
    const selectRequest = new NextRequest('http://localhost:3000/api/user/templates/some-id/select', {
      method: 'POST',
    })
    const selectParams = Promise.resolve({ id: 'some-id' })
    const selectResponse = await POST_SELECT(selectRequest, { params: selectParams })
    expect(selectResponse.status).toBe(401)

    // Duplicate
    const dupRequest = new NextRequest('http://localhost:3000/api/user/templates/some-id/duplicate', {
      method: 'POST',
    })
    const dupParams = Promise.resolve({ id: 'some-id' })
    const dupResponse = await POST_DUPLICATE(dupRequest, { params: dupParams })
    expect(dupResponse.status).toBe(401)

    // Mine
    const mineRequest = new NextRequest('http://localhost:3000/api/user/templates/mine')
    const mineResponse = await GET_MINE(mineRequest)
    expect(mineResponse.status).toBe(401)
  })

  test('GET /api/user/templates with search parameter returns filtered results', async () => {
    const uniquePrefix = `XQ7searchable-${nanoid(6)}`
    const target = await prisma.videoTemplate.create({
      data: {
        name: `${uniquePrefix} Theme`,
        config: {},
        isPublished: true,
      },
    })
    createdTemplateIds.push(target.id)

    const noise = await prisma.videoTemplate.create({
      data: {
        name: `Unrelated Noise ${nanoid(6)}`,
        config: {},
        isPublished: true,
      },
    })
    createdTemplateIds.push(noise.id)

    const request = new NextRequest(
      `http://localhost:3000/api/user/templates?search=${encodeURIComponent(uniquePrefix)}`
    )
    const response = await GET_BROWSE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    const ids = data.templates.map((t: { id: string }) => t.id)
    expect(ids).toContain(target.id)
    expect(ids).not.toContain(noise.id)
  })

  test('GET /api/user/templates response includes selectedTemplateId in metadata', async () => {
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Metadata Check Template ${nanoid(6)}`,
        config: {},
        isPublished: true,
      },
    })
    createdTemplateIds.push(template.id)

    // Set user's selectedTemplateId
    await prisma.user.update({
      where: { id: testUser.id },
      data: { selectedTemplateId: template.id },
    })

    const request = new NextRequest('http://localhost:3000/api/user/templates')
    const response = await GET_BROWSE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('selectedTemplateId')
    expect(data.selectedTemplateId).toBe(template.id)
  })

  test('POST /api/user/templates/[id]/select returns 404 for unpublished template', async () => {
    const unpublished = await prisma.videoTemplate.create({
      data: {
        name: `Unpublished Select Target ${nanoid(6)}`,
        config: {},
        isPublished: false,
      },
    })
    createdTemplateIds.push(unpublished.id)

    const request = new NextRequest(`http://localhost:3000/api/user/templates/${unpublished.id}/select`, {
      method: 'POST',
    })
    const params = Promise.resolve({ id: unpublished.id })
    const response = await POST_SELECT(request, { params })

    expect(response.status).toBe(404)
  })

  test('POST /api/user/templates/[id]/duplicate validates copied config', async () => {
    const source = await prisma.videoTemplate.create({
      data: {
        name: `Config Validation Source ${nanoid(6)}`,
        config: { global: { colors: { accent: '#aaa' } } },
        isPublished: true,
      },
    })
    createdTemplateIds.push(source.id)

    // First call succeeds (validateTemplateConfig returns valid)
    const request1 = new NextRequest(`http://localhost:3000/api/user/templates/${source.id}/duplicate`, {
      method: 'POST',
    })
    const params1 = Promise.resolve({ id: source.id })
    const response1 = await POST_DUPLICATE(request1, { params: params1 })
    expect(response1.status).toBe(201)
    const data1 = await response1.json()
    createdTemplateIds.push(data1.template.id)

    // Verify validateTemplateConfig was called
    expect(mockValidateTemplateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        global: expect.objectContaining({
          colors: expect.objectContaining({ accent: '#aaa' }),
        }),
      })
    )

    // Now test with validation failure
    mockValidateTemplateConfig.mockReturnValue({
      valid: false,
      errors: [{ path: 'global.colors.accent', message: 'Invalid color', value: 'bad' }],
    })

    const request2 = new NextRequest(`http://localhost:3000/api/user/templates/${source.id}/duplicate`, {
      method: 'POST',
    })
    const params2 = Promise.resolve({ id: source.id })
    const response2 = await POST_DUPLICATE(request2, { params: params2 })
    expect(response2.status).toBe(500)
    const data2 = await response2.json()
    expect(data2.error).toContain('validation failed')
  })

  test('My Templates mine endpoint returns empty when user has no personal templates', async () => {
    const request = new NextRequest('http://localhost:3000/api/user/templates/mine')
    const response = await GET_MINE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.templates).toEqual([])
  })

  test('My Templates section hidden when user has no personal templates (via empty mine response)', async () => {
    // Verify that creating a published template for system does not appear in mine
    const systemTemplate = await prisma.videoTemplate.create({
      data: {
        name: `System Template ${nanoid(6)}`,
        config: {},
        isPublished: true,
        userId: null,
      },
    })
    createdTemplateIds.push(systemTemplate.id)

    const request = new NextRequest('http://localhost:3000/api/user/templates/mine')
    const response = await GET_MINE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    // System templates should not appear in "My Templates"
    const ids = data.templates.map((t: { id: string }) => t.id)
    expect(ids).not.toContain(systemTemplate.id)
    expect(data.templates.length).toBe(0)
  })
})
