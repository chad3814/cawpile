/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

describe('VideoTemplate Model', () => {
  const createdTemplateIds: string[] = []

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
    // Clean up templates created during each test
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
      createdTemplateIds.length = 0
    }
  })

  test('should create a VideoTemplate with required fields (name, config)', async () => {
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Test Template ${nanoid(6)}`,
        config: {
          global: {
            colors: {
              accent: '#3b82f6',
            },
          },
        },
      },
    })
    createdTemplateIds.push(template.id)

    expect(template).toMatchObject({
      name: expect.stringContaining('Test Template'),
      config: {
        global: {
          colors: {
            accent: '#3b82f6',
          },
        },
      },
    })
    expect(template.id).toBeDefined()
    expect(template.description).toBeNull()
    expect(template.previewThumbnailUrl).toBeNull()
  })

  test('should create a VideoTemplate with optional fields (description, previewThumbnailUrl)', async () => {
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Complete Template ${nanoid(6)}`,
        description: 'A test template with all fields',
        previewThumbnailUrl: 'https://example.com/thumbnail.jpg',
        config: {
          intro: {
            layout: 'minimal',
          },
        },
      },
    })
    createdTemplateIds.push(template.id)

    expect(template.name).toContain('Complete Template')
    expect(template.description).toBe('A test template with all fields')
    expect(template.previewThumbnailUrl).toBe('https://example.com/thumbnail.jpg')
  })

  test('should generate automatic timestamps (createdAt, updatedAt)', async () => {
    const beforeCreate = new Date()

    const template = await prisma.videoTemplate.create({
      data: {
        name: `Timestamp Template ${nanoid(6)}`,
        config: {},
      },
    })
    createdTemplateIds.push(template.id)

    const afterCreate = new Date()

    expect(template.createdAt).toBeInstanceOf(Date)
    expect(template.updatedAt).toBeInstanceOf(Date)
    expect(template.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
    expect(template.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
  })

  test('should accept valid JSON objects in the config field', async () => {
    const complexConfig = {
      global: {
        colors: {
          background: '#0a0a0a',
          accent: '#f97316',
        },
        fonts: {
          heading: 'Inter, system-ui, sans-serif',
        },
        timing: {
          introTotal: 75,
          bookTotal: 150,
        },
      },
      intro: {
        layout: 'centered',
        titleFontSize: 72,
        showYear: true,
      },
      bookReveal: {
        layout: 'sequential',
        showRatings: true,
        coverSize: 'large',
      },
    }

    const template = await prisma.videoTemplate.create({
      data: {
        name: `Complex Config Template ${nanoid(6)}`,
        config: complexConfig,
      },
    })
    createdTemplateIds.push(template.id)

    expect(template.config).toEqual(complexConfig)
  })

  test('should retrieve templates by ID and support ordering by createdAt', async () => {
    // Create multiple templates with small delays
    const template1 = await prisma.videoTemplate.create({
      data: {
        name: `Order Test 1 ${nanoid(6)}`,
        config: { order: 1 },
      },
    })
    createdTemplateIds.push(template1.id)

    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 50))

    const template2 = await prisma.videoTemplate.create({
      data: {
        name: `Order Test 2 ${nanoid(6)}`,
        config: { order: 2 },
      },
    })
    createdTemplateIds.push(template2.id)

    // Test retrieval by ID
    const retrieved = await prisma.videoTemplate.findUnique({
      where: { id: template1.id },
    })
    expect(retrieved).toBeDefined()
    expect(retrieved?.name).toContain('Order Test 1')

    // Test ordering by createdAt descending (newest first)
    const ordered = await prisma.videoTemplate.findMany({
      where: { id: { in: [template1.id, template2.id] } },
      orderBy: { createdAt: 'desc' },
    })
    expect(ordered).toHaveLength(2)
    expect(ordered[0].id).toBe(template2.id) // Newer one first
    expect(ordered[1].id).toBe(template1.id)
  })

  test('should update updatedAt timestamp on modification', async () => {
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Update Test ${nanoid(6)}`,
        config: {},
      },
    })
    createdTemplateIds.push(template.id)

    const originalUpdatedAt = template.updatedAt

    // Wait to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 100))

    const updated = await prisma.videoTemplate.update({
      where: { id: template.id },
      data: { name: 'Updated Name' },
    })

    expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
  })
})
