/**
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth-helpers'
import { PATCH as REORDER } from '@/app/api/user/books/reorder/route'
import { PATCH as PIN } from '@/app/api/user/books/[id]/pin/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe('Library section ordering APIs', () => {
  let testUserId: string
  const bookIds: string[] = []
  const editionIds: string[] = []
  const dbBookIds: string[] = []
  const suffix = nanoid(6)

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-reorder-${suffix}@test.com`,
        name: 'Test Reorder User',
      },
    })
    testUserId = user.id

    // Create 3 books with editions and userBooks
    for (let i = 0; i < 3; i++) {
      const book = await prisma.book.create({
        data: {
          title: `Reorder Book ${i} ${suffix}`,
          authors: ['Author'],
        },
      })
      dbBookIds.push(book.id)
      const edition = await prisma.edition.create({
        data: { bookId: book.id },
      })
      editionIds.push(edition.id)
      const userBook = await prisma.userBook.create({
        data: {
          userId: testUserId,
          editionId: edition.id,
          status: 'WANT_TO_READ',
          format: ['PAPERBACK'],
        },
      })
      bookIds.push(userBook.id)
    }

    mockGetCurrentUser.mockResolvedValue({
      id: testUserId,
      email: `test-reorder-${suffix}@test.com`,
      isAdmin: false,
      isSuperAdmin: false,
    })
  })

  afterAll(async () => {
    await prisma.userBook.deleteMany({ where: { userId: testUserId } })
    await prisma.edition.deleteMany({ where: { id: { in: editionIds } } })
    await prisma.book.deleteMany({ where: { id: { in: dbBookIds } } })
    await prisma.user.delete({ where: { id: testUserId } })
    await prisma.$disconnect()
  })

  describe('PATCH /api/user/books/reorder', () => {
    test('sets sortOrder based on array position', async () => {
      const reversed = [...bookIds].reverse()
      const request = new NextRequest('http://localhost:3000/api/user/books/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ bookIds: reversed }),
      })

      const response = await REORDER(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)

      // Verify order was persisted
      const books = await prisma.userBook.findMany({
        where: { id: { in: bookIds } },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, sortOrder: true },
      })

      expect(books[0].id).toBe(reversed[0])
      expect(books[0].sortOrder).toBe(0)
      expect(books[1].id).toBe(reversed[1])
      expect(books[1].sortOrder).toBe(1)
      expect(books[2].id).toBe(reversed[2])
      expect(books[2].sortOrder).toBe(2)
    })

    test('rejects empty bookIds array', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/books/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ bookIds: [] }),
      })

      const response = await REORDER(request)
      expect(response.status).toBe(400)
    })

    test('rejects request with non-existent book IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/books/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ bookIds: ['nonexistent-id'] }),
      })

      const response = await REORDER(request)
      expect(response.status).toBe(404)
    })

    test('returns 401 when unauthenticated', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/user/books/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ bookIds }),
      })

      const response = await REORDER(request)
      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /api/user/books/[id]/pin', () => {
    test('toggles isPinned from false to true', async () => {
      const request = new NextRequest(`http://localhost:3000/api/user/books/${bookIds[0]}/pin`, {
        method: 'PATCH',
      })

      const response = await PIN(request, { params: Promise.resolve({ id: bookIds[0] }) })
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.userBook.isPinned).toBe(true)
    })

    test('toggles isPinned from true back to false', async () => {
      const request = new NextRequest(`http://localhost:3000/api/user/books/${bookIds[0]}/pin`, {
        method: 'PATCH',
      })

      const response = await PIN(request, { params: Promise.resolve({ id: bookIds[0] }) })
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.userBook.isPinned).toBe(false)
    })

    test('returns 404 for non-existent book', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/books/nonexistent/pin', {
        method: 'PATCH',
      })

      const response = await PIN(request, { params: Promise.resolve({ id: 'nonexistent' }) })
      expect(response.status).toBe(404)
    })

    test('returns 401 when unauthenticated', async () => {
      mockGetCurrentUser.mockResolvedValueOnce(null)

      const request = new NextRequest(`http://localhost:3000/api/user/books/${bookIds[0]}/pin`, {
        method: 'PATCH',
      })

      const response = await PIN(request, { params: Promise.resolve({ id: bookIds[0] }) })
      expect(response.status).toBe(401)
    })
  })
})
