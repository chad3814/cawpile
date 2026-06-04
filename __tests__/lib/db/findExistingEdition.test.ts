/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
import type { SignedBookSearchResult } from '@/lib/search/types'
import { findExistingEdition } from '@/lib/db/books'

const prisma = new PrismaClient()

describe('findExistingEdition', () => {
  let bookId: string
  let editionId: string
  const isbn13 = `978${Math.floor(Math.random() * 1e9)}`

  beforeAll(async () => {
    const book = await prisma.book.create({
      data: { title: `Find Edition ${nanoid(6)}`, authors: ['Author'] },
    })
    bookId = book.id
    const edition = await prisma.edition.create({
      data: { bookId, isbn13 },
    })
    editionId = edition.id
  })

  afterAll(async () => {
    await prisma.edition.deleteMany({ where: { bookId } })
    await prisma.book.delete({ where: { id: bookId } })
    await prisma.$disconnect()
  })

  it('finds an edition by isbn13', async () => {
    const signed: SignedBookSearchResult = {
      id: 'x', googleId: '', title: 'x', authors: ['Author'], categories: [],
      isbn13, sources: [],
    }
    const found = await findExistingEdition(signed)
    expect(found?.id).toBe(editionId)
  })

  it('returns null when no identifiers match', async () => {
    const signed: SignedBookSearchResult = {
      id: 'x', googleId: '', title: 'x', authors: ['Author'], categories: [],
      isbn13: `978${Math.floor(Math.random() * 1e9)}`, sources: [],
    }
    expect(await findExistingEdition(signed)).toBeNull()
  })

  it('returns null when the signed result carries no identifiers', async () => {
    const signed: SignedBookSearchResult = {
      id: 'x', googleId: '', title: 'x', authors: ['Author'], categories: [], sources: [],
    }
    expect(await findExistingEdition(signed)).toBeNull()
  })
})
