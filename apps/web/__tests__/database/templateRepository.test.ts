/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

describe('VideoTemplate Repository Schema', () => {
  const createdTemplateIds: string[] = []
  const createdUserIds: string[] = []

  afterAll(async () => {
    // Clean up users first (cascade will handle selectedTemplateId)
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      })
    }
    // Clean up templates
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
    }
    await prisma.$disconnect()
  })

  afterEach(async () => {
    // Clean up users first (to remove foreign key references)
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      })
      createdUserIds.length = 0
    }
    // Clean up templates
    if (createdTemplateIds.length > 0) {
      await prisma.videoTemplate.deleteMany({
        where: { id: { in: createdTemplateIds } },
      })
      createdTemplateIds.length = 0
    }
  })

  test('should create a VideoTemplate with userId, isPublished, and usageCount fields', async () => {
    // Create a user to serve as creator
    const user = await prisma.user.create({
      data: {
        email: `template-creator-${nanoid(6)}@test.com`,
        name: 'Template Creator',
      },
    })
    createdUserIds.push(user.id)

    const template = await prisma.videoTemplate.create({
      data: {
        name: `Repo Template ${nanoid(6)}`,
        config: { global: { colors: { accent: '#ff0000' } } },
        userId: user.id,
        isPublished: true,
        usageCount: 5,
      },
    })
    createdTemplateIds.push(template.id)

    expect(template.userId).toBe(user.id)
    expect(template.isPublished).toBe(true)
    expect(template.usageCount).toBe(5)

    // Verify defaults when not specified
    const templateDefaults = await prisma.videoTemplate.create({
      data: {
        name: `Default Repo Template ${nanoid(6)}`,
        config: {},
      },
    })
    createdTemplateIds.push(templateDefaults.id)

    expect(templateDefaults.userId).toBeNull()
    expect(templateDefaults.isPublished).toBe(false)
    expect(templateDefaults.usageCount).toBe(0)
  })

  test('should support User selectedTemplateId relation (set and clear)', async () => {
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Selectable Template ${nanoid(6)}`,
        config: {},
        isPublished: true,
      },
    })
    createdTemplateIds.push(template.id)

    const user = await prisma.user.create({
      data: {
        email: `selector-${nanoid(6)}@test.com`,
        name: 'Template Selector',
        selectedTemplateId: template.id,
      },
    })
    createdUserIds.push(user.id)

    // Verify it was set
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { selectedTemplateId: true },
    })
    expect(foundUser?.selectedTemplateId).toBe(template.id)

    // Clear the selection
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { selectedTemplateId: null },
    })
    expect(updatedUser.selectedTemplateId).toBeNull()
  })

  test('should set User selectedTemplateId to null when VideoTemplate is deleted (onDelete: SetNull)', async () => {
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Deletable Template ${nanoid(6)}`,
        config: {},
        isPublished: true,
      },
    })
    // Do not push to createdTemplateIds because we will delete it manually

    const user = await prisma.user.create({
      data: {
        email: `orphan-selector-${nanoid(6)}@test.com`,
        name: 'Orphan Selector',
        selectedTemplateId: template.id,
      },
    })
    createdUserIds.push(user.id)

    // Confirm the selection is set
    const beforeDelete = await prisma.user.findUnique({
      where: { id: user.id },
      select: { selectedTemplateId: true },
    })
    expect(beforeDelete?.selectedTemplateId).toBe(template.id)

    // Delete the template
    await prisma.videoTemplate.delete({
      where: { id: template.id },
    })

    // Verify the user's selectedTemplateId is now null
    const afterDelete = await prisma.user.findUnique({
      where: { id: user.id },
      select: { selectedTemplateId: true },
    })
    expect(afterDelete?.selectedTemplateId).toBeNull()
  })

  test('should resolve creator relation between VideoTemplate and User correctly', async () => {
    const creator = await prisma.user.create({
      data: {
        email: `creator-${nanoid(6)}@test.com`,
        name: 'Template Author',
        image: 'https://example.com/avatar.jpg',
      },
    })
    createdUserIds.push(creator.id)

    const template = await prisma.videoTemplate.create({
      data: {
        name: `Authored Template ${nanoid(6)}`,
        config: {},
        userId: creator.id,
        isPublished: true,
      },
    })
    createdTemplateIds.push(template.id)

    // Fetch template with creator relation
    const templateWithCreator = await prisma.videoTemplate.findUnique({
      where: { id: template.id },
      include: {
        creator: {
          select: { name: true, image: true },
        },
      },
    })

    expect(templateWithCreator?.creator).toBeDefined()
    expect(templateWithCreator?.creator?.name).toBe('Template Author')
    expect(templateWithCreator?.creator?.image).toBe('https://example.com/avatar.jpg')

    // Fetch user with createdTemplates back-relation
    const userWithTemplates = await prisma.user.findUnique({
      where: { id: creator.id },
      include: {
        createdTemplates: true,
      },
    })

    expect(userWithTemplates?.createdTemplates).toHaveLength(1)
    expect(userWithTemplates?.createdTemplates[0].id).toBe(template.id)
  })
})
