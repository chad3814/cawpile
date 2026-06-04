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

  describe('Amazon ASIN fallback (Kindle-only editions with no ISBN/Google ID)', () => {
    let asinEditionId: string
    const asin = `B0${nanoid(8).toUpperCase()}`

    beforeAll(async () => {
      const edition = await prisma.edition.create({ data: { bookId } })
      asinEditionId = edition.id
      await prisma.amazonBook.create({
        data: { asin, editionId: asinEditionId, title: 'Kindle Edition', authors: ['Author'] },
      })
    })

    it('finds the edition via the amazon source ASIN when no ISBN/Google ID is present', async () => {
      const signed: SignedBookSearchResult = {
        id: `amazon-${asin}`, googleId: '', title: 'Kindle Edition', authors: ['Author'], categories: [],
        sources: [
          { provider: 'amazon', data: { id: `amazon-${asin}`, googleId: '', title: 'Kindle Edition', authors: ['Author'], categories: [], source: 'amazon', sourceWeight: 3, asin } },
        ],
      }
      const found = await findExistingEdition(signed)
      expect(found?.id).toBe(asinEditionId)
    })

    it('rejects an ASIN match when a non-matching bookId guard is supplied', async () => {
      const signed: SignedBookSearchResult = {
        id: `amazon-${asin}`, googleId: '', title: 'Kindle Edition', authors: ['Author'], categories: [],
        sources: [
          { provider: 'amazon', data: { id: `amazon-${asin}`, googleId: '', title: 'Kindle Edition', authors: ['Author'], categories: [], source: 'amazon', sourceWeight: 3, asin } },
        ],
      }
      expect(await findExistingEdition(signed, 'some-other-book-id')).toBeNull()
    })
  })
})
