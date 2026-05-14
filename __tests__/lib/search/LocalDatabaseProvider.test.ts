/**
 * @jest-environment node
 *
 * Tests the LocalDatabaseProvider's handling of provider relations,
 * especially the case where a book's only metadata source is AmazonBook
 * (Kindle-only adds via the asin: tagged search).
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
import { LocalDatabaseProvider } from '@/lib/search/providers/LocalDatabaseProvider'

const prisma = new PrismaClient()

describe('LocalDatabaseProvider — Amazon-only cover surface', () => {
  let testBookIds: string[] = []

  afterEach(async () => {
    for (const id of testBookIds) {
      await prisma.amazonBook.deleteMany({ where: { edition: { bookId: id } } })
      await prisma.edition.deleteMany({ where: { bookId: id } })
      await prisma.book.deleteMany({ where: { id } })
    }
    testBookIds = []
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('returns AmazonBook.imageUrl for a book whose only provider row is AmazonBook', async () => {
    const titleSlug = `Resonance-${nanoid(8)}`
    const expectedImageUrl = 'https://m.media-amazon.com/images/I/test-cover.jpg'

    const book = await prisma.book.create({
      data: {
        title: `${titleSlug} of Souls`,
        authors: ['Test Author'],
      },
    })
    testBookIds.push(book.id)

    const edition = await prisma.edition.create({
      data: {
        bookId: book.id,
        title: `${titleSlug} of Souls`,
        authors: ['Test Author'],
      },
    })

    await prisma.amazonBook.create({
      data: {
        asin: `B0${nanoid(8).toUpperCase()}`,
        editionId: edition.id,
        title: `${titleSlug} of Souls`,
        authors: ['Test Author'],
        categories: [],
        imageUrl: expectedImageUrl,
      },
    })

    const provider = new LocalDatabaseProvider()
    const results = await provider.search(titleSlug, 10)

    const withCover = results.find(r => r.imageUrl === expectedImageUrl)
    expect(withCover).toBeDefined()
    expect(withCover?.title).toContain(titleSlug)
  })

  test('Book-table match (no Edition.title) still surfaces a cover via the first Edition', async () => {
    const titleSlug = `BookOnly-${nanoid(8)}`
    const expectedImageUrl = 'https://m.media-amazon.com/images/I/book-cover.jpg'

    const book = await prisma.book.create({
      data: {
        title: `${titleSlug} Title`,
        authors: ['Test Author'],
      },
    })
    testBookIds.push(book.id)

    // Edition with no title — mimics the real "no subtitle" Amazon path
    // when Edition.title happens to be null. The Book table is what matches
    // the free-text title query.
    const edition = await prisma.edition.create({
      data: { bookId: book.id, title: null, authors: ['Test Author'] },
    })

    await prisma.amazonBook.create({
      data: {
        asin: `B0${nanoid(8).toUpperCase()}`,
        editionId: edition.id,
        title: `${titleSlug} Title`,
        authors: ['Test Author'],
        categories: [],
        imageUrl: expectedImageUrl,
      },
    })

    const provider = new LocalDatabaseProvider()
    const results = await provider.search(titleSlug, 10)

    const bookResult = results.find(r => r.id === book.id)
    expect(bookResult).toBeDefined()
    expect(bookResult?.imageUrl).toBe(expectedImageUrl)
  })
})
