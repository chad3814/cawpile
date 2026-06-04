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

describe('POST /api/user/books - re-reads and duplicate tracking', () => {
  let userId: string
  let editionId: string
  let bookId: string
  let signedResult: SignedBookSearchResult
  let POST: typeof import('@/app/api/user/books/route').POST

  beforeAll(async () => {
    if (!process.env.SEARCH_SIGNING_SECRET) {
      process.env.SEARCH_SIGNING_SECRET = 'test-signing-secret-minimum-32-characters-long!'
    }
    // Import AFTER the secret is set so signResult/verifySignature use it.
    ;({ POST } = await import('@/app/api/user/books/route'))
    const { signResult } = await import('@/lib/search/utils/signResult')

    const user = await prisma.user.create({
      data: { email: `reread-${nanoid(6)}@test.com`, name: 'Reread User' },
    })
    userId = user.id

    const isbn13 = `978${Math.floor(Math.random() * 1e9)}`
    const book = await prisma.book.create({
      data: { title: `Reread Book ${nanoid(6)}`, authors: ['Author'] },
    })
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
  })

  afterAll(async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    await prisma.edition.deleteMany({ where: { bookId } })
    await prisma.book.delete({ where: { id: bookId } }).catch(() => {})
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'reread@test.com' } as Awaited<ReturnType<typeof getCurrentUser>>)
  })

  function post(body: Record<string, unknown>) {
    return POST(new Request('http://localhost/api/user/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signedResult, format: ['HARDCOVER'], ...body }),
    }) as never)
  }

  it('creates a re-read with incremented readNumber and honors submitted isReread', async () => {
    await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.COMPLETED, readNumber: 1, format: [] } })
    const res = await post({ status: 'READING', isReread: false })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.action).toBe('reread')
    expect(json.userBook.readNumber).toBe(2)
    expect(json.userBook.isReread).toBe(false) // not forced true
    const rows = await prisma.userBook.count({ where: { userId, editionId } })
    expect(rows).toBe(2)
  })

  it('defaults finishDate=now and progress=100 for a COMPLETED re-read with no dates sent', async () => {
    await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.COMPLETED, readNumber: 1, format: [] } })
    const res = await post({ status: 'COMPLETED' }) // no finishDate, no progress
    const json = await res.json()
    expect(json.action).toBe('reread')
    expect(json.userBook.readNumber).toBe(2)
    expect(json.userBook.progress).toBe(100)
    expect(json.userBook.finishDate).not.toBeNull()
  })

  it('updates TBR -> READING in place and sets startDate', async () => {
    const ub = await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.WANT_TO_READ, readNumber: 1, format: [] } })
    const res = await post({ status: 'READING', startDate: '2026-01-15' })
    const json = await res.json()
    expect(json.action).toBe('updated')
    expect(json.userBook.id).toBe(ub.id)
    expect(json.userBook.status).toBe('READING')
    expect(json.userBook.startDate).not.toBeNull()
    expect(await prisma.userBook.count({ where: { userId, editionId } })).toBe(1)
  })

  it('moves READING -> TBR, clears startDate, keeps progress', async () => {
    const ub = await prisma.userBook.create({
      data: { userId, editionId, status: BookStatus.READING, readNumber: 1, startDate: new Date('2026-01-01'), progress: 42, format: [] },
    })
    const res = await post({ status: 'WANT_TO_READ' })
    const json = await res.json()
    expect(json.action).toBe('updated')
    expect(json.userBook.id).toBe(ub.id)
    expect(json.userBook.status).toBe('WANT_TO_READ')
    expect(json.userBook.startDate).toBeNull()
    expect(json.userBook.progress).toBe(42)
  })

  it('updates READING -> COMPLETED in place, sets progress=100 and a finishDate', async () => {
    const ub = await prisma.userBook.create({
      data: { userId, editionId, status: BookStatus.READING, readNumber: 1, format: [], startDate: new Date('2026-01-01'), progress: 30 },
    })
    const res = await post({ status: 'COMPLETED', finishDate: '2026-02-01' })
    const json = await res.json()
    expect(json.action).toBe('updated')
    expect(json.userBook.id).toBe(ub.id)
    expect(json.userBook.status).toBe('COMPLETED')
    expect(json.userBook.progress).toBe(100)
    expect(json.userBook.finishDate).not.toBeNull()
    expect(await prisma.userBook.count({ where: { userId, editionId } })).toBe(1)
  })

  it('updates READING -> DNF in place, writes dnfReason and a finishDate', async () => {
    const ub = await prisma.userBook.create({
      data: { userId, editionId, status: BookStatus.READING, readNumber: 1, format: [], startDate: new Date('2026-01-01') },
    })
    const res = await post({ status: 'DNF', dnfReason: 'Lost interest' })
    const json = await res.json()
    expect(json.action).toBe('updated')
    expect(json.userBook.id).toBe(ub.id)
    expect(json.userBook.status).toBe('DNF')
    expect(json.userBook.dnfReason).toBe('Lost interest')
    expect(json.userBook.finishDate).not.toBeNull()
  })

  it('no-ops when already on TBR', async () => {
    await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.WANT_TO_READ, readNumber: 1, format: [] } })
    const res = await post({ status: 'WANT_TO_READ' })
    const json = await res.json()
    expect(json.action).toBe('noop')
    expect(json.message).toBe('Already on your TBR')
    expect(await prisma.userBook.count({ where: { userId, editionId } })).toBe(1)
  })

  it('no-ops when already Currently Reading', async () => {
    await prisma.userBook.create({ data: { userId, editionId, status: BookStatus.READING, readNumber: 1, format: [] } })
    const res = await post({ status: 'READING' })
    const json = await res.json()
    expect(json.action).toBe('noop')
    expect(json.message).toBe('Already in Currently Reading')
  })

  it('creates a first record when none exists', async () => {
    const res = await post({ status: 'WANT_TO_READ' })
    const json = await res.json()
    expect(json.action).toBe('created')
    expect(json.userBook.readNumber).toBe(1)
  })

  // NOTE: the P2002-retry dedup path (a concurrent double-submit re-resolving to a
  // no-op instead of minting a phantom read) is verified by the resolveTrackingAction
  // unit matrix plus the sequential "no-ops when already Currently Reading" case above.
  // A live two-request concurrency test is intentionally omitted: it races on the
  // pre-existing unguarded provider-record upserts inside findOrCreateEditionFromSignedResult,
  // which makes it flaky for reasons unrelated to the readNumber dedup.
})
