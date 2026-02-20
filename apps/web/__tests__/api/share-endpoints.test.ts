/**
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// Mock the auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth-helpers'
import { POST, PATCH, DELETE } from '@/app/api/user/books/[id]/share/route'
import { GET } from '@/app/api/share/reviews/[shareToken]/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe('Share API Endpoints', () => {
  let testUserId: string
  let testUserBookId: string
  let testBookId: string

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-share-api-${nanoid(6)}@test.com`,
        name: 'Test Share API User',
      },
    })
    testUserId = user.id

    // Create test book
    const book = await prisma.book.create({
      data: {
        title: `Test Book API ${nanoid(6)}`,
        authors: ['Test API Author'],
      },
    })
    testBookId = book.id

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
      where: { userBook: { userId: testUserId } },
    })
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
    // Clean up shared reviews after each test
    await prisma.sharedReview.deleteMany({
      where: { userId: testUserId },
    })
    jest.clearAllMocks()
  })

  describe('POST /api/user/books/[id]/share', () => {
    test('should create a share and return share URL for completed book with rating', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'test@test.com',
        name: 'Test User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'POST',
        body: JSON.stringify({
          showDates: true,
          showBookClubs: true,
          showReadathons: true,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const params = Promise.resolve({ id: testUserBookId })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.shareUrl).toBeDefined()
      expect(data.shareToken).toBeDefined()
      expect(data.sharedReview).toMatchObject({
        userId: testUserId,
        userBookId: testUserBookId,
        showDates: true,
        showBookClubs: true,
        showReadathons: true,
      })

      // Verify database record created
      const dbShare = await prisma.sharedReview.findUnique({
        where: { userBookId: testUserBookId },
      })
      expect(dbShare).toBeDefined()
      expect(dbShare?.shareToken).toBe(data.shareToken)
    })

    test('should return 401 if user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: testUserBookId })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    test('should return 400 if book is not completed', async () => {
      // Create a separate edition for non-completed book
      const readingEdition = await prisma.edition.create({
        data: {
          bookId: testBookId,
          isbn13: `979${nanoid(10)}`,
        },
      })

      const readingBook = await prisma.userBook.create({
        data: {
          userId: testUserId,
          editionId: readingEdition.id,
          status: 'READING',
          format: ['EBOOK'],
        },
      })

      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'test@test.com',
        name: 'Test User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'POST',
        body: JSON.stringify({
          showDates: true,
          showBookClubs: true,
          showReadathons: true,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const params = Promise.resolve({ id: readingBook.id })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Only completed books can be shared')

      // Cleanup
      await prisma.userBook.delete({ where: { id: readingBook.id } })
      await prisma.edition.delete({ where: { id: readingEdition.id } })
    })

    test('should return existing share if already created', async () => {
      // Create initial share
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
        },
      })

      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'test@test.com',
        name: 'Test User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'POST',
        body: JSON.stringify({
          showDates: true,
          showBookClubs: true,
          showReadathons: true,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const params = Promise.resolve({ id: testUserBookId })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.shareToken).toBe(shareToken)
      expect(data.sharedReview.shareToken).toBe(shareToken)

      // Verify only one share exists in database
      const shares = await prisma.sharedReview.findMany({
        where: { userBookId: testUserBookId },
      })
      expect(shares).toHaveLength(1)
    })
  })

  describe('GET /api/share/reviews/[shareToken]', () => {
    test('should return public review data without authentication', async () => {
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
        },
      })

      const request = new NextRequest(`http://localhost:3000/api/share/reviews/${shareToken}`)
      const params = Promise.resolve({ shareToken })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.book).toBeDefined()
      expect(data.cawpileRating).toBeDefined()
      expect(data.cawpileRating.average).toBe(8.0)

      // Verify cache headers
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
    })

    test('should return 404 for invalid shareToken', async () => {
      const invalidToken = nanoid(21)

      const request = new NextRequest(`http://localhost:3000/api/share/reviews/${invalidToken}`)
      const params = Promise.resolve({ shareToken: invalidToken })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Share not found')
    })

    test('should respect privacy settings for conditional fields', async () => {
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
          showDates: false,
          showBookClubs: false,
          showReadathons: false,
        },
      })

      const request = new NextRequest(`http://localhost:3000/api/share/reviews/${shareToken}`)
      const params = Promise.resolve({ shareToken })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.startDate).toBeUndefined()
      expect(data.finishDate).toBeUndefined()
      expect(data.bookClubName).toBeUndefined()
      expect(data.readathonName).toBeUndefined()
    })
  })

  describe('PATCH /api/user/books/[id]/share', () => {
    test('should update privacy settings for existing share', async () => {
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
        },
      })

      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'test@test.com',
        name: 'Test User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'PATCH',
        body: JSON.stringify({
          showDates: false,
          showBookClubs: false,
        }),
      })
      const params = Promise.resolve({ id: testUserBookId })

      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sharedReview.showDates).toBe(false)
      expect(data.sharedReview.showBookClubs).toBe(false)
      expect(data.sharedReview.showReadathons).toBe(true) // Should remain unchanged

      // Verify database updated
      const dbShare = await prisma.sharedReview.findUnique({
        where: { userBookId: testUserBookId },
      })
      expect(dbShare?.showDates).toBe(false)
      expect(dbShare?.showBookClubs).toBe(false)
    })

    test('should return 403 if user does not own the share', async () => {
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
        },
      })

      // Mock different user
      mockGetCurrentUser.mockResolvedValue({
        id: 'different-user-id',
        email: 'other@test.com',
        name: 'Other User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'PATCH',
        body: JSON.stringify({
          showDates: false,
        }),
      })
      const params = Promise.resolve({ id: testUserBookId })

      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')
    })
  })

  describe('DELETE /api/user/books/[id]/share', () => {
    test('should delete share and return 204', async () => {
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
        },
      })

      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'test@test.com',
        name: 'Test User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: testUserBookId })

      const response = await DELETE(request, { params })

      expect(response.status).toBe(204)

      // Verify share deleted from database
      const dbShare = await prisma.sharedReview.findUnique({
        where: { userBookId: testUserBookId },
      })
      expect(dbShare).toBeNull()
    })

    test('should return 403 if user does not own the share', async () => {
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
        },
      })

      // Mock different user
      mockGetCurrentUser.mockResolvedValue({
        id: 'different-user-id',
        email: 'other@test.com',
        name: 'Other User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'DELETE',
      })
      const params = Promise.resolve({ id: testUserBookId })

      const response = await DELETE(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')

      // Verify share still exists
      const dbShare = await prisma.sharedReview.findUnique({
        where: { userBookId: testUserBookId },
      })
      expect(dbShare).toBeDefined()
    })
  })
})
