/**
 * @jest-environment node
 */

import { PrismaClient, BookStatus } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// Mock the auth helpers
jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth-helpers'
import { GET } from '@/app/api/charts/pages-per-month/route'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe('GET /api/charts/pages-per-month - DNF Books Handling', () => {
  let testUserId: string
  let testBookId: string
  let testEditionId: string

  const testYear = 2024

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-pages-chart-${nanoid(6)}@test.com`,
        name: 'Test Pages Chart User',
      },
    })
    testUserId = user.id

    // Create test book
    const book = await prisma.book.create({
      data: {
        title: `Test Pages Book ${nanoid(6)}`,
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

    // Create GoogleBook with page count
    await prisma.googleBook.create({
      data: {
        googleId: `google-${nanoid(10)}`,
        editionId: edition.id,
        title: 'Test Pages Book',
        authors: ['Test Author'],
        pageCount: 300,
      },
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.userBook.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.googleBook.deleteMany({
      where: { editionId: testEditionId },
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
    await prisma.userBook.deleteMany({
      where: { userId: testUserId },
    })
    jest.clearAllMocks()
  })

  test('DNF book with 50% progress should calculate half the pages', async () => {
    // Create DNF book with 50% progress
    await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.DNF,
        format: ['PAPERBACK'],
        progress: 50,
        finishDate: new Date(`${testYear}-06-15`),
      },
    })

    mockGetCurrentUser.mockResolvedValue({
      id: testUserId,
      email: 'test@test.com',
      name: 'Test User',
      isAdmin: false,
      isSuperAdmin: false,
    })

    const request = new Request(`http://localhost:3000/api/charts/pages-per-month?year=${testYear}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)

    // June (index 5) should have 150 pages (300 * 0.5)
    const juneData = data.data.find((m: { month: string }) => m.month === 'Jun')
    expect(juneData).toBeDefined()
    expect(juneData.value).toBe(150)

    // Total should also be 150
    expect(data.total).toBe(150)
  })

  test('DNF book with 0% progress should be excluded from chart', async () => {
    // Create DNF book with 0% progress
    await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.DNF,
        format: ['PAPERBACK'],
        progress: 0,
        finishDate: new Date(`${testYear}-07-20`),
      },
    })

    mockGetCurrentUser.mockResolvedValue({
      id: testUserId,
      email: 'test@test.com',
      name: 'Test User',
      isAdmin: false,
      isSuperAdmin: false,
    })

    const request = new Request(`http://localhost:3000/api/charts/pages-per-month?year=${testYear}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)

    // Total should be 0 since DNF with 0% progress is excluded
    expect(data.total).toBe(0)

    // July should have 0 pages
    const julyData = data.data.find((m: { month: string }) => m.month === 'Jul')
    expect(julyData?.value || 0).toBe(0)
  })

  test('COMPLETED book should still use full page count', async () => {
    // Create a completed book
    await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.COMPLETED,
        format: ['PAPERBACK'],
        progress: 100,
        finishDate: new Date(`${testYear}-08-10`),
      },
    })

    mockGetCurrentUser.mockResolvedValue({
      id: testUserId,
      email: 'test@test.com',
      name: 'Test User',
      isAdmin: false,
      isSuperAdmin: false,
    })

    const request = new Request(`http://localhost:3000/api/charts/pages-per-month?year=${testYear}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)

    // August (index 7) should have full 300 pages
    const augustData = data.data.find((m: { month: string }) => m.month === 'Aug')
    expect(augustData).toBeDefined()
    expect(augustData.value).toBe(300)

    // Total should be 300
    expect(data.total).toBe(300)
  })
})
