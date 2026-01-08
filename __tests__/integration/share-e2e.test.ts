/**
 * @jest-environment node
 *
 * Integration tests for social sharing feature
 * Task Group 5.3: Strategic integration tests for critical workflows
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

describe('Social Sharing E2E Integration', () => {
  let testUserId: string
  let testUserBookId: string
  let testBookId: string
  let testBookTitle: string
  let testEditionId: string

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-e2e-${nanoid(6)}@test.com`,
        name: 'Test E2E User',
      },
    })
    testUserId = user.id

    // Create test book with all metadata
    testBookTitle = `E2E Test Book ${nanoid(6)}`
    const book = await prisma.book.create({
      data: {
        title: testBookTitle,
        authors: ['E2E Author'],
        bookType: 'FICTION',
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

    // Create Google Book metadata with required googleId field
    const googleId = `gb-${nanoid(10)}`
    await prisma.googleBook.create({
      data: {
        editionId: edition.id,
        googleId: googleId,
        title: testBookTitle,
        authors: ['E2E Author'],
        imageUrl: 'https://example.com/cover.jpg',
        categories: [],
      },
    })

    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: edition.id,
        status: 'COMPLETED',
        format: ['HARDCOVER'],
        startDate: new Date('2024-01-01'),
        finishDate: new Date('2024-01-15'),
        bookClubName: 'E2E Book Club',
        readathonName: 'E2E Readathon',
        review: 'This is an E2E test review.',
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
    await prisma.googleBook.deleteMany({
      where: { edition: { bookId: testBookId } },
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
    // Clean up shared reviews after each test to prevent unique constraint violations
    await prisma.sharedReview.deleteMany({
      where: { userId: testUserId },
    })
    jest.clearAllMocks()
  })

  describe('E2E: Complete Share Creation to Public Display', () => {
    test('should create share and display full content on public page', async () => {
      // Step 1: Create share via POST endpoint
      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'test@test.com',
        name: 'Test User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const createRequest = new NextRequest('http://localhost:3000/api/user/books/test/share', {
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
      const createParams = Promise.resolve({ id: testUserBookId })

      const createResponse = await POST(createRequest, { params: createParams })
      const createData = await createResponse.json()

      expect(createResponse.status).toBe(200)
      expect(createData.shareToken).toBeDefined()

      const shareToken = createData.shareToken

      // Step 2: Fetch public review via GET endpoint
      const getRequest = new NextRequest(`http://localhost:3000/api/share/reviews/${shareToken}`)
      const getParams = Promise.resolve({ shareToken })

      const getResponse = await GET(getRequest, { params: getParams })
      const publicData = await getResponse.json()

      // Step 3: Verify all expected data is present
      expect(getResponse.status).toBe(200)
      expect(publicData.book.title).toBe(testBookTitle)
      expect(publicData.book.authors).toEqual(['E2E Author'])
      expect(publicData.cawpileRating.average).toBe(8.0)
      expect(publicData.review).toBe('This is an E2E test review.')
      expect(publicData.startDate).toBeDefined()
      expect(publicData.finishDate).toBeDefined()
      expect(publicData.bookClubName).toBe('E2E Book Club')
      expect(publicData.readathonName).toBe('E2E Readathon')

      // Cleanup
      await prisma.sharedReview.deleteMany({
        where: { userBookId: testUserBookId },
      })
    })
  })

  describe('E2E: Privacy Toggle Updates', () => {
    test('should update privacy settings and reflect changes on public page', async () => {
      // Step 1: Create initial share
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
          showDates: true,
          showBookClubs: true,
          showReadathons: true,
        },
      })

      // Step 2: Verify all fields visible initially
      const getRequest1 = new NextRequest(`http://localhost:3000/api/share/reviews/${shareToken}`)
      const getParams1 = Promise.resolve({ shareToken })

      const getResponse1 = await GET(getRequest1, { params: getParams1 })
      const publicData1 = await getResponse1.json()

      expect(publicData1.startDate).toBeDefined()
      expect(publicData1.bookClubName).toBe('E2E Book Club')
      expect(publicData1.readathonName).toBe('E2E Readathon')

      // Step 3: Update privacy settings via PATCH
      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'test@test.com',
        name: 'Test User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const patchRequest = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'PATCH',
        body: JSON.stringify({
          showDates: false,
          showBookClubs: false,
          showReadathons: false,
        }),
      })
      const patchParams = Promise.resolve({ id: testUserBookId })

      const patchResponse = await PATCH(patchRequest, { params: patchParams })
      expect(patchResponse.status).toBe(200)

      // Step 4: Verify fields hidden on public page
      const getRequest2 = new NextRequest(`http://localhost:3000/api/share/reviews/${shareToken}`)
      const getParams2 = Promise.resolve({ shareToken })

      const getResponse2 = await GET(getRequest2, { params: getParams2 })
      const publicData2 = await getResponse2.json()

      expect(publicData2.startDate).toBeUndefined()
      expect(publicData2.finishDate).toBeUndefined()
      expect(publicData2.bookClubName).toBeUndefined()
      expect(publicData2.readathonName).toBeUndefined()

      // Cleanup
      await prisma.sharedReview.deleteMany({
        where: { userBookId: testUserBookId },
      })
    })
  })

  describe('E2E: Share Deletion Workflow', () => {
    test('should delete share and return 404 on public page', async () => {
      // Step 1: Create share
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
        },
      })

      // Step 2: Verify share exists
      const getRequest1 = new NextRequest(`http://localhost:3000/api/share/reviews/${shareToken}`)
      const getParams1 = Promise.resolve({ shareToken })

      const getResponse1 = await GET(getRequest1, { params: getParams1 })
      expect(getResponse1.status).toBe(200)

      // Step 3: Delete share via DELETE endpoint
      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'test@test.com',
        name: 'Test User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const deleteRequest = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'DELETE',
      })
      const deleteParams = Promise.resolve({ id: testUserBookId })

      const deleteResponse = await DELETE(deleteRequest, { params: deleteParams })
      expect(deleteResponse.status).toBe(204)

      // Step 4: Verify 404 on public page
      const getRequest2 = new NextRequest(`http://localhost:3000/api/share/reviews/${shareToken}`)
      const getParams2 = Promise.resolve({ shareToken })

      const getResponse2 = await GET(getRequest2, { params: getParams2 })
      expect(getResponse2.status).toBe(404)

      // Cleanup (already deleted, but ensure clean state)
      await prisma.sharedReview.deleteMany({
        where: { userBookId: testUserBookId },
      })
    })
  })

  describe('Edge Case: Book Without Rating', () => {
    test('should return 400 when attempting to share book without CAWPILE rating', async () => {
      // Create userBook without rating
      const edition2 = await prisma.edition.create({
        data: {
          bookId: testBookId,
          isbn13: `979${nanoid(10)}`,
        },
      })

      const userBookNoRating = await prisma.userBook.create({
        data: {
          userId: testUserId,
          editionId: edition2.id,
          status: 'COMPLETED',
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
      const params = Promise.resolve({ id: userBookNoRating.id })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Book must have a CAWPILE rating to be shared')

      // Cleanup
      await prisma.userBook.delete({ where: { id: userBookNoRating.id } })
      await prisma.edition.delete({ where: { id: edition2.id } })
    })
  })

  describe('Edge Case: Duplicate Share Creation', () => {
    test('should return existing share when attempting to create duplicate', async () => {
      // Create initial share
      const initialToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken: initialToken,
        },
      })

      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'test@test.com',
        name: 'Test User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      // Attempt to create second share
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
      expect(data.shareToken).toBe(initialToken)

      // Verify only one share exists
      const shares = await prisma.sharedReview.findMany({
        where: { userBookId: testUserBookId },
      })
      expect(shares).toHaveLength(1)

      // Cleanup
      await prisma.sharedReview.deleteMany({
        where: { userBookId: testUserBookId },
      })
    })
  })

  describe('Security: Cross-User Share Access', () => {
    test('should prevent user from deleting another users share', async () => {
      // Create share for testUser
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
        },
      })

      // Mock different user attempting delete
      mockGetCurrentUser.mockResolvedValue({
        id: 'malicious-user-id',
        email: 'malicious@test.com',
        name: 'Malicious User',
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
      const share = await prisma.sharedReview.findUnique({
        where: { userBookId: testUserBookId },
      })
      expect(share).toBeDefined()

      // Cleanup
      await prisma.sharedReview.deleteMany({
        where: { userBookId: testUserBookId },
      })
    })

    test('should prevent user from updating another users share settings', async () => {
      // Create share for testUser
      const shareToken = nanoid(21)
      await prisma.sharedReview.create({
        data: {
          userId: testUserId,
          userBookId: testUserBookId,
          shareToken,
        },
      })

      // Mock different user attempting update
      mockGetCurrentUser.mockResolvedValue({
        id: 'malicious-user-id',
        email: 'malicious@test.com',
        name: 'Malicious User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/user/books/test/share', {
        method: 'PATCH',
        body: JSON.stringify({ showDates: false }),
      })
      const params = Promise.resolve({ id: testUserBookId })

      const response = await PATCH(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Forbidden')

      // Verify settings unchanged
      const share = await prisma.sharedReview.findUnique({
        where: { userBookId: testUserBookId },
      })
      expect(share?.showDates).toBe(true)

      // Cleanup
      await prisma.sharedReview.deleteMany({
        where: { userBookId: testUserBookId },
      })
    })
  })

  describe('ShareToken Format Validation', () => {
    test('should generate shareToken with minimum 21 characters', async () => {
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
      expect(data.shareToken).toBeDefined()
      expect(data.shareToken.length).toBeGreaterThanOrEqual(21)

      // Verify token is URL-safe (alphanumeric and hyphens/underscores)
      expect(data.shareToken).toMatch(/^[A-Za-z0-9_-]+$/)

      // Cleanup
      await prisma.sharedReview.deleteMany({
        where: { userBookId: testUserBookId },
      })
    })
  })

  describe('Invalid ShareToken Handling', () => {
    test('should return 404 for non-existent shareToken', async () => {
      const invalidToken = nanoid(21)

      const request = new NextRequest(`http://localhost:3000/api/share/reviews/${invalidToken}`)
      const params = Promise.resolve({ shareToken: invalidToken })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Share not found')
    })

    test('should return 404 for malformed shareToken', async () => {
      const malformedToken = 'not-a-valid-token!'

      const request = new NextRequest(`http://localhost:3000/api/share/reviews/${malformedToken}`)
      const params = Promise.resolve({ shareToken: malformedToken })

      const response = await GET(request, { params })

      expect(response.status).toBe(404)
    })
  })
})
