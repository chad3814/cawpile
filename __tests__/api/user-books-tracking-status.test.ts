/**
 * @jest-environment node
 */
import { PrismaClient, BookStatus } from '@prisma/client'
import { nanoid } from 'nanoid'
import type { SignedBookSearchResult, SourceEntry } from '@/lib/search/types'
import type { BookSearchResult } from '@/types/book'

const prisma = new PrismaClient()

jest.mock('@/lib/auth-helpers', () => ({ getCurrentUser: jest.fn() }))
import { getCurrentUser } from '@/lib/auth-helpers'
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

describe('POST /api/user/books/tracking-status', () => {
  let userId: string
  let bookId: string
  let editionId: string
  let signedResult: SignedBookSearchResult
  let POST: typeof import('@/app/api/user/books/tracking-status/route').POST

  beforeAll(async () => {
    if (!process.env.SEARCH_SIGNING_SECRET) {
      process.env.SEARCH_SIGNING_SECRET = 'test-signing-secret-minimum-32-characters-long!'
    }
    const { POST: handler } = await import('@/app/api/user/books/tracking-status/route')
    POST = handler
    const { signResult } = await import('@/lib/search/utils/signResult')

    const user = await prisma.user.create({ data: { email: `ts-${nanoid(6)}@test.com`, name: 'TS User' } })
    userId = user.id
    const isbn13 = `978${Math.floor(Math.random() * 1e9)}`
    const book = await prisma.book.create({ data: { title: `TS Book ${nanoid(6)}`, authors: ['Author'] } })
    bookId = book.id
    const edition = await prisma.edition.create({ data: { bookId, isbn13 } })
    editionId = edition.id

    const sources: SourceEntry[] = [
      { provider: 'google', data: { id: 'g1', googleId: 'g1', title: book.title, authors: ['Author'], categories: [], source: 'google', sourceWeight: 5 } },
    ]
    const base: BookSearchResult & { sources: SourceEntry[] } = {
      id: 'g1', googleId: 'g1', title: book.title, authors: ['Author'], categories: [], isbn13, sources,
    }
    signedResult = { ...base, signature: signResult(base) }
    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'ts@test.com' } as Awaited<ReturnType<typeof getCurrentUser>>)
  })

  afterAll(async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    await prisma.edition.deleteMany({ where: { bookId } })
    await prisma.book.delete({ where: { id: bookId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  function post(body: Record<string, unknown>) {
    return POST(new Request('http://localhost/api/user/books/tracking-status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }) as never)
  }

  it('returns null status for an untracked book', async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    const json = await (await post({ signedResult })).json()
    expect(json.status).toBeNull()
    expect(json.readNumber).toBe(0)
  })

  it('returns the latest status for a tracked book', async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.COMPLETED, readNumber: 1, format: [] } })
    const json = await (await post({ signedResult })).json()
    expect(json.status).toBe('COMPLETED')
    expect(json.readNumber).toBe(1)
  })

  it('rejects an invalid signature', async () => {
    const res = await post({ signedResult: { ...signedResult, signature: 'bad' } })
    expect(res.status).toBe(400)
  })
})
