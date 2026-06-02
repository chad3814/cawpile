/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
import { recomputeBookStats } from '@/lib/db/bookStats'

jest.mock('@/lib/auth/admin', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/audit/logger', () => ({
  logAdminAction: jest.fn(),
  logFieldChanges: jest.fn(),
}))
jest.mock('@/lib/auth-helpers', () => ({ getCurrentUser: jest.fn() }))
jest.mock('@/lib/s3-upload', () => ({
  deleteAvatar: jest.fn(),
  extractKeyFromUrl: jest.fn(() => null),
}))

import { DELETE as DELETE_BOOK } from '@/app/api/admin/books/[id]/route'
import { getCurrentUser as getAdminUser } from '@/lib/auth/admin'
import { DELETE as DELETE_USER } from '@/app/api/user/route'
import { getCurrentUser as getSessionUser } from '@/lib/auth-helpers'

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Admin book delete decrements global stats', () => {
  let userId: string
  let bookId: string
  let editionId: string

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `${nanoid()}@t.test` } })
    userId = user.id
    const book = await prisma.book.create({ data: { title: `T-${nanoid()}`, authors: ['A'] } })
    bookId = book.id
    const edition = await prisma.edition.create({ data: { bookId } })
    editionId = edition.id

    const ub = await prisma.userBook.create({
      data: { userId, editionId, status: 'COMPLETED', format: ['EBOOK'] },
    })
    await prisma.cawpileRating.create({ data: { userBookId: ub.id, average: 8 } })

    // Baseline: make the book contribute (ratingCount=1, ratingSum=8) to global.
    await prisma.$transaction((tx) => recomputeBookStats(bookId, tx))
  })

  afterAll(async () => {
    // Book is already deleted by the test (cascade removed its edition/userBook/rating).
    // If the test failed before the DELETE ran, clean up defensively (deleteMany is a no-op
    // if the rows are already gone).
    await prisma.edition.deleteMany({ where: { id: editionId } })
    await prisma.book.deleteMany({ where: { id: bookId } })
    await prisma.user.deleteMany({ where: { id: userId } })
  })

  it('decrements global ratings by the deleted book contribution', async () => {
    const before = await prisma.globalBookStats.findUniqueOrThrow({ where: { id: 'global' } })

    ;(getAdminUser as jest.Mock).mockResolvedValue({ id: userId, isAdmin: true })

    const res = await DELETE_BOOK(new Request('http://localhost'), {
      params: Promise.resolve({ id: bookId }),
    })
    expect(res.status).toBe(200)

    const gone = await prisma.book.findUnique({ where: { id: bookId } })
    expect(gone).toBeNull()

    const after = await prisma.globalBookStats.findUniqueOrThrow({ where: { id: 'global' } })
    expect(after.ratingsCount).toBe(before.ratingsCount - 1)
    expect(after.ratingsTotal).toBe(before.ratingsTotal - 8)
  })
})

describe('Account deletion recomputes affected books', () => {
  let userAId: string
  let userBId: string
  let bookId: string
  let editionId: string

  beforeAll(async () => {
    const book = await prisma.book.create({ data: { title: `T-${nanoid()}`, authors: ['A'] } })
    bookId = book.id
    const edition = await prisma.edition.create({ data: { bookId } })
    editionId = edition.id

    const userA = await prisma.user.create({ data: { email: `${nanoid()}@t.test` } })
    userAId = userA.id
    const userB = await prisma.user.create({ data: { email: `${nanoid()}@t.test` } })
    userBId = userB.id

    const ubA = await prisma.userBook.create({
      data: { userId: userAId, editionId, status: 'COMPLETED', format: ['EBOOK'] },
    })
    await prisma.cawpileRating.create({ data: { userBookId: ubA.id, average: 8 } })
    const ubB = await prisma.userBook.create({
      data: { userId: userBId, editionId, status: 'COMPLETED', format: ['EBOOK'] },
    })
    await prisma.cawpileRating.create({ data: { userBookId: ubB.id, average: 8 } })

    // Baseline: readerCount 2, ratingCount 2, ratingSum 16.
    await prisma.$transaction((tx) => recomputeBookStats(bookId, tx))
  })

  afterAll(async () => {
    // userA is deleted by the test. Remove userB (cascades its userBook/rating),
    // recompute so global nets back to pre-test value, then drop edition + book.
    await prisma.user.deleteMany({ where: { id: userBId } })
    await prisma.$transaction((tx) => recomputeBookStats(bookId, tx))
    await prisma.edition.deleteMany({ where: { bookId } })
    await prisma.book.deleteMany({ where: { id: bookId } })
  })

  it('recomputes per-book stats and decrements global on account delete', async () => {
    const before = await prisma.globalBookStats.findUniqueOrThrow({ where: { id: 'global' } })

    ;(getSessionUser as jest.Mock).mockResolvedValue({ id: userAId })

    const res = await DELETE_USER()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })

    const goneUser = await prisma.user.findUnique({ where: { id: userAId } })
    expect(goneUser).toBeNull()

    const book = await prisma.book.findUniqueOrThrow({ where: { id: bookId } })
    expect(book.readerCount).toBe(1)
    expect(book.ratingCount).toBe(1)
    expect(book.ratingSum).toBe(8)

    const after = await prisma.globalBookStats.findUniqueOrThrow({ where: { id: 'global' } })
    expect(after.ratingsCount).toBe(before.ratingsCount - 1)
    expect(after.ratingsTotal).toBe(before.ratingsTotal - 8)
  })
})
