/**
 * Tests for the asin: tagged search handler path.
 */
import { handleTaggedSearch } from '@/lib/search/handlers/taggedSearchHandler'
import * as amazonClient from '@/lib/search/utils/amazonClient'
import type { AmazonProduct } from '@/lib/search/utils/amazonClient'
import { verifySignature } from '@/lib/search/utils/signResult'

jest.mock('@/lib/search/utils/amazonClient', () => {
  const actual = jest.requireActual('@/lib/search/utils/amazonClient')
  return {
    ...actual,
    CachedAmazonClient: jest.fn(),
    RainforestClient: jest.fn(),
  }
})

const mockedCachedClient = amazonClient.CachedAmazonClient as jest.MockedClass<typeof amazonClient.CachedAmazonClient>

describe('handleTaggedSearch (asin)', () => {
  let getProductByAsin: jest.Mock

  beforeEach(() => {
    getProductByAsin = jest.fn()
    mockedCachedClient.mockImplementation(() => ({
      getProductByAsin,
    } as unknown as InstanceType<typeof amazonClient.CachedAmazonClient>))
  })

  test('returns a wrapped result for a B0 ASIN', async () => {
    const product: AmazonProduct = {
      asin: 'B084DWX1PV',
      title: 'Kindle Book',
      authors: ['Author A'],
      description: 'desc',
      publishedDate: '2024-01-15',
      pageCount: 250,
      imageUrl: 'https://example.com/cover.jpg',
      categories: ['Fiction'],
      isbn10: undefined,
      isbn13: undefined,
      publisher: 'Test Publisher',
    }
    getProductByAsin.mockResolvedValueOnce(product)

    const response = await handleTaggedSearch('asin', 'B084DWX1PV')

    expect(response.taggedSearch).toBe(true)
    expect(response.provider).toBe('amazon')
    expect(response.error).toBeUndefined()
    expect(response.books).toHaveLength(1)
    const book = response.books[0]
    expect(book.title).toBe('Kindle Book')
    expect(book.authors).toEqual(['Author A'])
    expect(book.sources).toHaveLength(1)
    expect(book.sources[0].provider).toBe('amazon')
    expect(book.sources[0].data.source).toBe('amazon')
    expect(book.sources[0].data.sourceWeight).toBe(3)
    expect(book.sources[0].data.asin).toBe('B084DWX1PV')
    expect(book.sources[0].data.publisher).toBe('Test Publisher')
  })

  test('returns a signed result that verifySignature accepts', async () => {
    const product: AmazonProduct = {
      asin: 'B084DWX1PV',
      title: 'Signed Book',
      authors: ['Author A'],
      categories: ['Fiction'],
    }
    getProductByAsin.mockResolvedValueOnce(product)

    const response = await handleTaggedSearch('asin', 'B084DWX1PV')

    expect(response.books).toHaveLength(1)
    expect(response.books[0].signature).toBeDefined()
    expect(typeof response.books[0].signature).toBe('string')
    expect(response.books[0].signature?.length).toBeGreaterThan(0)
    expect(verifySignature(response.books[0])).toBe(true)
  })

  test('returns a wrapped result for an ISBN-10-shaped ASIN', async () => {
    const product: AmazonProduct = {
      asin: '0451524934',
      title: 'Print Book',
      authors: ['Author B'],
      categories: [],
      isbn10: '0451524934',
      isbn13: '9780451524935',
    }
    getProductByAsin.mockResolvedValueOnce(product)

    const response = await handleTaggedSearch('asin', '0451524934')

    expect(response.error).toBeUndefined()
    expect(response.books).toHaveLength(1)
    expect(response.books[0].isbn10).toBe('0451524934')
    expect(response.books[0].isbn13).toBe('9780451524935')
  })

  test('rejects ASINs that are not 10 alphanumeric characters', async () => {
    const tooShort = await handleTaggedSearch('asin', 'B0XX')
    expect(tooShort.error).toMatch(/Invalid ASIN/)
    expect(tooShort.books).toEqual([])

    const hyphens = await handleTaggedSearch('asin', 'B084-DWX1PV')
    expect(hyphens.error).toMatch(/Invalid ASIN/)
    expect(hyphens.books).toEqual([])

    expect(getProductByAsin).not.toHaveBeenCalled()
  })

  test('returns not-found error when client returns null', async () => {
    getProductByAsin.mockResolvedValueOnce(null)

    const response = await handleTaggedSearch('asin', 'B084DWX1PV')

    expect(response.books).toEqual([])
    expect(response.provider).toBe('amazon')
    expect(response.error).toMatch(/not found/i)
  })
})
