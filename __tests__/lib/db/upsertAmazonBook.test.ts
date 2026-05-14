/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
import { upsertAllProviderRecords, findOrCreateEditionFromSignedResult } from '@/lib/db/books'
import type { SourceEntry, SignedBookSearchResult } from '@/lib/search/types'
import { signResult } from '@/lib/search/utils/signResult'
import type { BookSearchResult } from '@/types/book'

const prisma = new PrismaClient()

describe('upsertAllProviderRecords (amazon)', () => {
  let testBookId: string
  let testEditionId: string

  beforeAll(async () => {
    const book = await prisma.book.create({
      data: { title: `Test Amazon Book ${nanoid(6)}`, authors: ['Test Author'] },
    })
    testBookId = book.id

    const edition = await prisma.edition.create({
      data: { bookId: book.id, isbn13: `978${nanoid(10)}` },
    })
    testEditionId = edition.id
  })

  afterAll(async () => {
    await prisma.amazonBook.deleteMany({ where: { editionId: testEditionId } })
    await prisma.edition.deleteMany({ where: { bookId: testBookId } })
    await prisma.book.deleteMany({ where: { id: testBookId } })
    await prisma.$disconnect()
  })

  afterEach(async () => {
    await prisma.amazonBook.deleteMany({ where: { editionId: testEditionId } })
  })

  function makeAmazonSource(asin: string): SourceEntry {
    return {
      provider: 'amazon',
      data: {
        id: `amazon-${asin}`,
        googleId: '',
        title: 'Amazon Source Book',
        authors: ['Amazon Author'],
        description: 'From Amazon',
        publishedDate: '2024-02-20',
        pageCount: 280,
        imageUrl: 'https://example.com/amz.jpg',
        categories: ['Fiction'],
        isbn10: '0451524934',
        isbn13: '9780451524935',
        source: 'amazon',
        sourceWeight: 3,
        asin,
        publisher: 'Amazon Publisher',
      },
    }
  }

  test('creates an AmazonBook from an amazon source', async () => {
    const result = await upsertAllProviderRecords(testEditionId, [makeAmazonSource('B084DWX1PV')])

    expect(result.amazon).toBe('created')

    const row = await prisma.amazonBook.findUnique({ where: { editionId: testEditionId } })
    expect(row).not.toBeNull()
    expect(row?.asin).toBe('B084DWX1PV')
    expect(row?.title).toBe('Amazon Source Book')
    expect(row?.authors).toEqual(['Amazon Author'])
    expect(row?.publisher).toBe('Amazon Publisher')
    expect(row?.isbn10).toBe('0451524934')
    expect(row?.isbn13).toBe('9780451524935')
  })

  test('updates an existing AmazonBook in place', async () => {
    await upsertAllProviderRecords(testEditionId, [makeAmazonSource('B084DWX1PV')])

    const updatedSource = makeAmazonSource('B084DWX1PV')
    updatedSource.data.title = 'Amazon Updated Title'
    updatedSource.data.publisher = 'Updated Publisher'

    const result = await upsertAllProviderRecords(testEditionId, [updatedSource])

    expect(result.amazon).toBe('updated')

    const row = await prisma.amazonBook.findUnique({ where: { editionId: testEditionId } })
    expect(row?.title).toBe('Amazon Updated Title')
    expect(row?.publisher).toBe('Updated Publisher')
  })

  test('result.amazon is null when no amazon source is supplied', async () => {
    const result = await upsertAllProviderRecords(testEditionId, [])
    expect(result.amazon).toBeNull()
  })
})

describe('findOrCreateEditionFromSignedResult — Amazon-only dedup', () => {
  const dedupPrisma = new PrismaClient()
  let dedupBookId: string
  let dedupEditionId: string
  let dedupAsin: string

  beforeAll(async () => {
    // Ensure SEARCH_SIGNING_SECRET is set for this test suite
    if (!process.env.SEARCH_SIGNING_SECRET) {
      process.env.SEARCH_SIGNING_SECRET = 'test-signing-secret-minimum-32-characters-long!'
    }
  })

  afterEach(async () => {
    // Clean up rows created during each test
    if (dedupBookId) {
      await dedupPrisma.amazonBook.deleteMany({ where: { editionId: dedupEditionId } })
      await dedupPrisma.edition.deleteMany({ where: { bookId: dedupBookId } })
      await dedupPrisma.book.deleteMany({ where: { id: dedupBookId } })
      dedupBookId = ''
      dedupEditionId = ''
      dedupAsin = ''
    }
  })

  afterAll(async () => {
    await dedupPrisma.$disconnect()
  })

  test('reuses existing Edition when source has only an ASIN (no ISBN) and an AmazonBook with that ASIN already exists', async () => {
    // 1. Create a Book.
    const book = await dedupPrisma.book.create({
      data: { title: `Kindle-Only Book ${nanoid(6)}`, authors: ['Kindle Author'] },
    })
    dedupBookId = book.id

    // 2. Create an Edition with no ISBN.
    const edition1 = await dedupPrisma.edition.create({
      data: { bookId: book.id },
    })
    dedupEditionId = edition1.id

    // 3. Create an AmazonBook attached to edition1 with a unique ASIN.
    dedupAsin = `B0${nanoid(8).toUpperCase()}`
    await dedupPrisma.amazonBook.create({
      data: {
        asin: dedupAsin,
        editionId: edition1.id,
        title: 'Kindle-Only Book',
        authors: ['Kindle Author'],
        categories: [],
      },
    })

    // 4. Construct a signed result with one amazon source and NO isbn/googleId.
    const sources: SourceEntry[] = [
      {
        provider: 'amazon',
        data: {
          id: `amazon-${dedupAsin}`,
          googleId: '',
          title: 'Kindle-Only Book',
          authors: ['Kindle Author'],
          categories: [],
          source: 'amazon',
          sourceWeight: 3,
          asin: dedupAsin,
        },
      },
    ]

    const baseResult: BookSearchResult & { sources: SourceEntry[] } = {
      id: `amazon-${dedupAsin}`,
      googleId: '',
      title: 'Kindle-Only Book',
      authors: ['Kindle Author'],
      categories: [],
      sources,
    }

    const signature = signResult(baseResult)
    const signedResult: SignedBookSearchResult = {
      ...baseResult,
      signature,
    }

    // 5. Call findOrCreateEditionFromSignedResult — simulating a second user adding the same Kindle book.
    const result = await findOrCreateEditionFromSignedResult(book.id, signedResult)

    // 6. Assertions.
    expect(result.id).toBe(edition1.id)
    const editions = await dedupPrisma.edition.findMany({ where: { bookId: book.id } })
    expect(editions).toHaveLength(1) // No second Edition was created.
  })
})
