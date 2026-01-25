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
import { PATCH } from '@/app/api/user/books/[id]/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe('PATCH /api/user/books/[id] - DNF Status Changes', () => {
  let testUserId: string
  let testBookId: string
  let testEditionId: string
  let testUserBookId: string

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: `test-dnf-patch-${nanoid(6)}@test.com`,
        name: 'Test DNF Patch User',
      },
    })
    testUserId = user.id

    // Create test book
    const book = await prisma.book.create({
      data: {
        title: `Test DNF Patch Book ${nanoid(6)}`,
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

  beforeEach(async () => {
    // Create a fresh userBook for each test
    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.READING,
        format: ['PAPERBACK'],
        progress: 50,
      },
    })
    testUserBookId = userBook.id

    mockGetCurrentUser.mockResolvedValue({
      id: testUserId,
      email: 'test@test.com',
      name: 'Test User',
      isAdmin: false,
      isSuperAdmin: false,
    })
  })

  afterEach(async () => {
    await prisma.userBook.deleteMany({
      where: { userId: testUserId },
    })
    jest.clearAllMocks()
  })

  test('status change to DNF without finishDate should auto-set current date', async () => {
    const beforeUpdate = new Date()

    const request = new NextRequest('http://localhost:3000/api/user/books/test', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'DNF',
        dnfReason: 'Did not enjoy the writing style',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const params = Promise.resolve({ id: testUserBookId })

    const response = await PATCH(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.userBook.status).toBe('DNF')
    expect(data.userBook.finishDate).toBeDefined()

    // finishDate should be approximately now (within a few seconds)
    const finishDate = new Date(data.userBook.finishDate)
    const afterUpdate = new Date()
    expect(finishDate.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    expect(finishDate.getTime()).toBeLessThanOrEqual(afterUpdate.getTime())
  }, 15000)

  test('status change to DNF with explicit finishDate should use provided date', async () => {
    const explicitDate = '2024-03-15'

    const request = new NextRequest('http://localhost:3000/api/user/books/test', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'DNF',
        finishDate: explicitDate,
        dnfReason: 'Too slow paced',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const params = Promise.resolve({ id: testUserBookId })

    const response = await PATCH(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.userBook.status).toBe('DNF')

    // finishDate should match the provided date
    const finishDate = new Date(data.userBook.finishDate)
    expect(finishDate.toISOString().split('T')[0]).toBe(explicitDate)
  })

  test('status change from DNF to another status should not clear finishDate', async () => {
    // First, make the book DNF with a finishDate
    await prisma.userBook.update({
      where: { id: testUserBookId },
      data: {
        status: BookStatus.DNF,
        finishDate: new Date('2024-06-15'),
        dnfReason: 'Did not connect with characters',
      },
    })

    // Now change status back to READING
    const request = new NextRequest('http://localhost:3000/api/user/books/test', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'READING',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const params = Promise.resolve({ id: testUserBookId })

    const response = await PATCH(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.userBook.status).toBe('READING')
    // finishDate should still be preserved (not explicitly cleared)
    expect(data.userBook.finishDate).toBeDefined()
    // DNF reason should be cleared when changing from DNF
    expect(data.userBook.dnfReason).toBeNull()
  })
})
