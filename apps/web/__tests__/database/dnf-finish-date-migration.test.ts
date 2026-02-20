/**
 * @jest-environment node
 */

import { PrismaClient, BookStatus } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

/**
 * Tests for the DNF finishDate migration behavior.
 * These tests verify that DNF books get their finishDate set to updatedAt
 * when finishDate is null, and existing finishDate values are preserved.
 */
describe('DNF finishDate Migration Behavior', () => {
  let testUserId: string
  let testBookId: string
  let testEditionId: string

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-dnf-migration-${nanoid(6)}@test.com`,
        name: 'Test DNF Migration User',
      },
    })
    testUserId = user.id

    // Create test book
    const book = await prisma.book.create({
      data: {
        title: `Test DNF Book ${nanoid(6)}`,
        authors: ['Test Author'],
      },
    })
    testBookId = book.id

    const edition = await prisma.edition.create({
      data: {
        bookId: book.id,
        isbn13: `978${nanoid(10)}`,
      },
    })
    testEditionId = edition.id
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.userBook.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.edition.deleteMany({
      where: { bookId: testBookId },
    })
    await prisma.book.deleteMany({
      where: { id: testBookId },
    })
    await prisma.user.deleteMany({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  afterEach(async () => {
    // Clean up userbooks after each test
    await prisma.userBook.deleteMany({
      where: { userId: testUserId },
    })
  })

  test('DNF books without finishDate should have finishDate set (simulating migration behavior)', async () => {
    // Create a DNF book without finishDate
    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.DNF,
        format: ['PAPERBACK'],
        // finishDate is intentionally null
      },
    })

    // Verify initial state - finishDate should be null
    const beforeUpdate = await prisma.userBook.findUnique({
      where: { id: userBook.id },
    })
    expect(beforeUpdate?.finishDate).toBeNull()
    expect(beforeUpdate?.updatedAt).toBeDefined()

    // Simulate migration behavior: set finishDate to updatedAt for DNF books without finishDate
    await prisma.$executeRaw`
      UPDATE "public"."UserBook"
      SET "finishDate" = "updatedAt"
      WHERE status = 'DNF' AND "finishDate" IS NULL AND id = ${userBook.id}::text
    `

    // Verify the update worked
    const afterUpdate = await prisma.userBook.findUnique({
      where: { id: userBook.id },
    })

    expect(afterUpdate?.finishDate).toBeDefined()
    expect(afterUpdate?.finishDate).not.toBeNull()
    // finishDate should now match updatedAt
    expect(afterUpdate?.finishDate?.getTime()).toBe(afterUpdate?.updatedAt.getTime())
  })

  test('DNF books with existing finishDate should not be modified (idempotency)', async () => {
    // Create a DNF book with an existing finishDate
    const existingFinishDate = new Date('2024-06-15T12:00:00.000Z')

    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.DNF,
        format: ['EBOOK'],
        finishDate: existingFinishDate,
      },
    })

    // Verify initial state - finishDate should be set
    const beforeUpdate = await prisma.userBook.findUnique({
      where: { id: userBook.id },
    })
    expect(beforeUpdate?.finishDate).toEqual(existingFinishDate)

    // Run the same migration query - it should not affect this book because finishDate is not null
    await prisma.$executeRaw`
      UPDATE "public"."UserBook"
      SET "finishDate" = "updatedAt"
      WHERE status = 'DNF' AND "finishDate" IS NULL
    `

    // Verify the finishDate was NOT modified
    const afterUpdate = await prisma.userBook.findUnique({
      where: { id: userBook.id },
    })

    expect(afterUpdate?.finishDate).toEqual(existingFinishDate)
    // The finishDate should NOT be the same as updatedAt
    expect(afterUpdate?.finishDate?.getTime()).not.toBe(afterUpdate?.updatedAt.getTime())
  })
})
