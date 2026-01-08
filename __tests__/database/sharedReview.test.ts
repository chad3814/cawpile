/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

describe('SharedReview Model', () => {
  let testUserId: string
  let testUserBookId: string

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-${nanoid(6)}@test.com`,
        name: 'Test User',
      },
    })
    testUserId = user.id

    // Create test book, edition, and userBook
    const book = await prisma.book.create({
      data: {
        title: `Test Book ${nanoid(6)}`,
        authors: ['Test Author'],
      },
    })

    const edition = await prisma.edition.create({
      data: {
        bookId: book.id,
        isbn13: `978${nanoid(10)}`,
      },
    })

    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: edition.id,
        status: 'COMPLETED',
        format: ['HARDCOVER'],
      },
    })
    testUserBookId = userBook.id

    // Create CAWPILE rating
    await prisma.cawpileRating.create({
      data: {
        userBookId: testUserBookId,
        characters: 8,
        atmosphere: 7,
        writing: 9,
        plot: 8,
        intrigue: 7,
        logic: 8,
        enjoyment: 9,
        average: 8.0,
      },
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.sharedReview.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.cawpileRating.deleteMany({
      where: { userBookId: testUserBookId },
    })
    await prisma.userBook.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.edition.deleteMany({
      where: { userBooks: { none: {} } },
    })
    await prisma.book.deleteMany({
      where: { editions: { none: {} } },
    })
    await prisma.user.deleteMany({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  afterEach(async () => {
    // Clean up shared reviews after each test
    await prisma.sharedReview.deleteMany({
      where: { userId: testUserId },
    })
  })

  test('should create a SharedReview with all required fields', async () => {
    const shareToken = nanoid(21)

    const sharedReview = await prisma.sharedReview.create({
      data: {
        userId: testUserId,
        userBookId: testUserBookId,
        shareToken,
        showDates: true,
        showBookClubs: true,
        showReadathons: true,
      },
    })

    expect(sharedReview).toMatchObject({
      userId: testUserId,
      userBookId: testUserBookId,
      shareToken,
      showDates: true,
      showBookClubs: true,
      showReadathons: true,
    })
    expect(sharedReview.id).toBeDefined()
    expect(sharedReview.createdAt).toBeInstanceOf(Date)
    expect(sharedReview.updatedAt).toBeInstanceOf(Date)
  })

  test('should enforce unique constraint on userBookId', async () => {
    const shareToken1 = nanoid(21)
    const shareToken2 = nanoid(21)

    // Create first share
    await prisma.sharedReview.create({
      data: {
        userId: testUserId,
        userBookId: testUserBookId,
        shareToken: shareToken1,
      },
    })

    // Attempt to create second share for same userBookId
    await expect(
      prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken: shareToken2,
        },
      })
    ).rejects.toThrow()
  })

  test('should enforce unique constraint on shareToken', async () => {
    // Create another userBook for second share
    const book2 = await prisma.book.create({
      data: {
        title: `Test Book 2 ${nanoid(6)}`,
        authors: ['Test Author 2'],
      },
    })

    const edition2 = await prisma.edition.create({
      data: {
        bookId: book2.id,
        isbn13: `978${nanoid(10)}`,
      },
    })

    const userBook2 = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: edition2.id,
        status: 'COMPLETED',
        format: ['HARDCOVER'],
      },
    })

    await prisma.cawpileRating.create({
      data: {
        userBookId: userBook2.id,
        characters: 7,
        atmosphere: 8,
        writing: 7,
        plot: 7,
        intrigue: 8,
        logic: 7,
        enjoyment: 8,
        average: 7.43,
      },
    })

    const shareToken = nanoid(21)

    // Create first share
    await prisma.sharedReview.create({
      data: {
        userId: testUserId,
        userBookId: testUserBookId,
        shareToken,
      },
    })

    // Attempt to create second share with same shareToken
    await expect(
      prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: userBook2.id,
          shareToken, // Same token
        },
      })
    ).rejects.toThrow()

    // Cleanup
    await prisma.sharedReview.deleteMany({
      where: { userBookId: userBook2.id },
    })
    await prisma.cawpileRating.deleteMany({
      where: { userBookId: userBook2.id },
    })
    await prisma.userBook.deleteMany({
      where: { id: userBook2.id },
    })
  })

  test('should apply default values for privacy toggles', async () => {
    const shareToken = nanoid(21)

    const sharedReview = await prisma.sharedReview.create({
      data: {
        userId: testUserId,
        userBookId: testUserBookId,
        shareToken,
        // Not specifying privacy toggles to test defaults
      },
    })

    expect(sharedReview.showDates).toBe(true)
    expect(sharedReview.showBookClubs).toBe(true)
    expect(sharedReview.showReadathons).toBe(true)
  })

  test('should allow updating privacy toggle fields', async () => {
    const shareToken = nanoid(21)

    const sharedReview = await prisma.sharedReview.create({
      data: {
        userId: testUserId,
        userBookId: testUserBookId,
        shareToken,
      },
    })

    const updated = await prisma.sharedReview.update({
      where: { id: sharedReview.id },
      data: {
        showDates: false,
        showBookClubs: false,
        showReadathons: false,
      },
    })

    expect(updated.showDates).toBe(false)
    expect(updated.showBookClubs).toBe(false)
    expect(updated.showReadathons).toBe(false)
  })

  test('should support finding by shareToken with includes', async () => {
    const shareToken = nanoid(21)

    await prisma.sharedReview.create({
      data: {
        userId: testUserId,
        userBookId: testUserBookId,
        shareToken,
      },
    })

    const found = await prisma.sharedReview.findUnique({
      where: { shareToken },
      include: {
        userBook: {
          include: {
            edition: {
              include: {
                book: true,
                googleBook: true,
              },
            },
            cawpileRating: true,
          },
        },
      },
    })

    expect(found).toBeDefined()
    expect(found?.shareToken).toBe(shareToken)
    expect(found?.userBook).toBeDefined()
    expect(found?.userBook.edition).toBeDefined()
    expect(found?.userBook.edition.book).toBeDefined()
    expect(found?.userBook.cawpileRating).toBeDefined()
  })

  test('should update updatedAt timestamp on modification', async () => {
    const shareToken = nanoid(21)

    const sharedReview = await prisma.sharedReview.create({
      data: {
        userId: testUserId,
        userBookId: testUserBookId,
        shareToken,
      },
    })

    const originalUpdatedAt = sharedReview.updatedAt

    // Wait a moment to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 100))

    const updated = await prisma.sharedReview.update({
      where: { id: sharedReview.id },
      data: { showDates: false },
    })

    expect(updated.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    )
  })

  test('should cascade delete SharedReview when UserBook is deleted', async () => {
    // Create a new userBook specifically for this test
    const book3 = await prisma.book.create({
      data: {
        title: `Test Book 3 ${nanoid(6)}`,
        authors: ['Test Author 3'],
      },
    })

    const edition3 = await prisma.edition.create({
      data: {
        bookId: book3.id,
        isbn13: `978${nanoid(10)}`,
      },
    })

    const userBook3 = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: edition3.id,
        status: 'COMPLETED',
        format: ['HARDCOVER'],
      },
    })

    await prisma.cawpileRating.create({
      data: {
        userBookId: userBook3.id,
        characters: 6,
        atmosphere: 7,
        writing: 8,
        plot: 7,
        intrigue: 6,
        logic: 7,
        enjoyment: 7,
        average: 6.86,
      },
    })

    const shareToken = nanoid(21)

    const sharedReview = await prisma.sharedReview.create({
      data: {
        userId: testUserId,
        userBookId: userBook3.id,
        shareToken,
      },
    })

    // Delete the userBook
    await prisma.userBook.delete({
      where: { id: userBook3.id },
    })

    // Verify SharedReview was cascade deleted
    const found = await prisma.sharedReview.findUnique({
      where: { id: sharedReview.id },
    })

    expect(found).toBeNull()
  })
})
