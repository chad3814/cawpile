/**
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// Mock the auth helpers
jest.mock('@/lib/auth/admin', () => ({
  requireSuperAdmin: jest.fn(),
}))

import { requireSuperAdmin } from '@/lib/auth/admin'
import { GET } from '@/app/api/admin/users/[id]/stats/route'
import { NextRequest } from 'next/server'

const mockRequireSuperAdmin = requireSuperAdmin as jest.MockedFunction<typeof requireSuperAdmin>

describe('GET /api/admin/users/[id]/stats', () => {
  let testSuperAdminId: string
  let testUserId: string
  let testBookId: string
  let testUserBookId: string

  beforeAll(async () => {
    // Create test super admin user
    const superAdmin = await prisma.user.create({
      data: {
        email: `test-super-admin-stats-${nanoid(6)}@test.com`,
        name: 'Test Super Admin',
        isAdmin: true,
        isSuperAdmin: true,
      },
    })
    testSuperAdminId = superAdmin.id

    // Create test user with books and shared reviews
    const user = await prisma.user.create({
      data: {
        email: `test-user-stats-${nanoid(6)}@test.com`,
        name: 'Test User with Data',
        isAdmin: false,
        isSuperAdmin: false,
      },
    })
    testUserId = user.id

    // Create test book and edition
    const book = await prisma.book.create({
      data: {
        title: `Test Book Stats ${nanoid(6)}`,
        authors: ['Test Author'],
        bookType: 'FICTION',
      },
    })
    testBookId = book.id

    const edition = await prisma.edition.create({
      data: {
        bookId: testBookId,
        isbn13: `978${nanoid(10)}`,
      },
    })

    // Create user book
    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: edition.id,
        status: 'COMPLETED',
        format: ['PAPERBACK'],
      },
    })
    testUserBookId = userBook.id

    // Create shared review
    await prisma.sharedReview.create({
      data: {
        userId: testUserId,
        userBookId: testUserBookId,
        shareToken: nanoid(21),
      },
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.sharedReview.deleteMany({
      where: { userId: testUserId },
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
      where: { id: { in: [testSuperAdminId, testUserId] } },
    })
    await prisma.$disconnect()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return user stats with book count and shared review count', async () => {
    mockRequireSuperAdmin.mockResolvedValue({
      id: testSuperAdminId,
      email: 'superadmin@test.com',
      name: 'Test Super Admin',
      isAdmin: true,
      isSuperAdmin: true,
    })

    const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUserId}/stats`, {
      method: 'GET',
    })
    const params = Promise.resolve({ id: testUserId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.booksCount).toBe(1)
    expect(data.sharedReviewsCount).toBe(1)
  })

  test('should return 401 for non-super-admin users', async () => {
    // Mock requireSuperAdmin throwing (redirect behavior)
    mockRequireSuperAdmin.mockRejectedValue(new Response(null, { status: 401 }))

    const request = new NextRequest(`http://localhost:3000/api/admin/users/${testUserId}/stats`, {
      method: 'GET',
    })
    const params = Promise.resolve({ id: testUserId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  test('should return 404 for non-existent user', async () => {
    mockRequireSuperAdmin.mockResolvedValue({
      id: testSuperAdminId,
      email: 'superadmin@test.com',
      name: 'Test Super Admin',
      isAdmin: true,
      isSuperAdmin: true,
    })

    const nonExistentId = 'non-existent-user-id'
    const request = new NextRequest(`http://localhost:3000/api/admin/users/${nonExistentId}/stats`, {
      method: 'GET',
    })
    const params = Promise.resolve({ id: nonExistentId })

    const response = await GET(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })
})
