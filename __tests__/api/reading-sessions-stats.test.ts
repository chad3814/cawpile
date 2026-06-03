/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/db/bookStats', () => ({ recomputeBookStats: jest.fn() }))

import { auth } from '@/lib/auth'
import { recomputeBookStats } from '@/lib/db/bookStats'
import { POST } from '@/app/api/reading-sessions/route'

const prisma = new PrismaClient()
const mockAuth = auth as unknown as jest.Mock
const mockRecompute = recomputeBookStats as unknown as jest.Mock

describe('POST /api/reading-sessions — recompute gating', () => {
  let userId: string
  let bookId: string
  let editionId: string
  let userBookId: string

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `${nanoid()}@t.test` } })
    userId = user.id
    const book = await prisma.book.create({ data: { title: `T-${nanoid()}`, authors: ['A'] } })
    bookId = book.id
    const edition = await prisma.edition.create({ data: { bookId } })
    editionId = edition.id
    await prisma.googleBook.create({
      data: { googleId: nanoid(), editionId, title: 'T', pageCount: 100 },
    })
    const ub = await prisma.userBook.create({
      data: { userId, editionId, status: 'READING', format: ['EBOOK'], currentPage: 0 },
    })
    userBookId = ub.id
    mockAuth.mockResolvedValue({ user: { id: userId } })
  })

  afterAll(async () => {
    await prisma.readingSession.deleteMany({ where: { userBookId } })
    await prisma.userBook.deleteMany({ where: { userId } })
    await prisma.googleBook.deleteMany({ where: { editionId } })
    await prisma.edition.deleteMany({ where: { bookId } })
    await prisma.book.deleteMany({ where: { id: bookId } })
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  })

  function post(body: Record<string, unknown>) {
    return POST(
      new NextRequest('http://localhost/api/reading-sessions', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    )
  }

  it('skips recompute for a progress update that stays READING', async () => {
    mockRecompute.mockClear()
    const res = await post({ userBookId, startPage: 1, endPage: 50 })
    expect(res.status).toBe(200)
    expect(mockRecompute).not.toHaveBeenCalled()
  })

  it('recomputes when the session completes the book', async () => {
    mockRecompute.mockClear()
    const res = await post({ userBookId, startPage: 51, endPage: 100 })
    expect(res.status).toBe(200)
    expect(mockRecompute).toHaveBeenCalledTimes(1)
    expect(mockRecompute).toHaveBeenCalledWith(bookId, expect.anything())
  })
})
