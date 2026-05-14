/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'
import { upsertAllProviderRecords } from '@/lib/db/books'
import type { SourceEntry } from '@/lib/search/types'

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
