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
import { POST } from '@/app/api/user/books/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>

function postRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/user/books', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/user/books — editionId branch', () => {
  let userId: string
  let bookId: string
  let editionId: string

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `track-${nanoid(6)}@test.com` } })
    userId = user.id
    const book = await prisma.book.create({ data: { title: `Track-${nanoid(6)}`, authors: ['A'] } })
    bookId = book.id
    const edition = await prisma.edition.create({ data: { bookId, isbn13: `978${nanoid(10)}` } })
    editionId = edition.id
  })

  afterEach(async () => {
    await prisma.userBook.deleteMany({ where: { userId } })
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await prisma.edition.deleteMany({ where: { bookId } })
    await prisma.book.deleteMany({ where: { id: bookId } })
    await prisma.user.deleteMany({ where: { id: userId } })
    await prisma.$disconnect()
  })

  it('adds an existing edition to the user library', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: userId } as Awaited<ReturnType<typeof getCurrentUser>>)
    const res = await POST(postRequest({ editionId, status: 'WANT_TO_READ', format: ['EBOOK'] }))
    expect(res.status).toBe(200)
    const created = await prisma.userBook.findUnique({
      where: { userId_editionId: { userId, editionId } },
    })
    expect(created).not.toBeNull()
    expect(created?.status).toBe('WANT_TO_READ')
  })

  it('returns 400 when the edition is already in the library', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: userId } as Awaited<ReturnType<typeof getCurrentUser>>)
    await prisma.userBook.create({ data: { userId, editionId, status: 'WANT_TO_READ', format: ['EBOOK'] } })
    const res = await POST(postRequest({ editionId, status: 'WANT_TO_READ', format: ['EBOOK'] }))
    expect(res.status).toBe(400)
  })

  it('returns 404 for an unknown edition id', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: userId } as Awaited<ReturnType<typeof getCurrentUser>>)
    const res = await POST(postRequest({ editionId: 'does-not-exist', status: 'WANT_TO_READ', format: ['EBOOK'] }))
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const res = await POST(postRequest({ editionId, status: 'WANT_TO_READ', format: ['EBOOK'] }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when both editionId and signedResult are provided', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: userId } as Awaited<ReturnType<typeof getCurrentUser>>)
    const res = await POST(postRequest({
      editionId,
      signedResult: { title: 'x', authors: ['y'] },
      status: 'WANT_TO_READ',
      format: ['EBOOK'],
    }))
    expect(res.status).toBe(400)
  })
})
