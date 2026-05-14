/**
 * Tests for AmazonClient (RainforestClient and CachedAmazonClient)
 */
import { RainforestClient } from '@/lib/search/utils/amazonClient'

const mockFetch = jest.fn()
global.fetch = mockFetch

const originalEnv = process.env

describe('RainforestClient.getProductByAsin', () => {
  let client: RainforestClient

  beforeEach(() => {
    mockFetch.mockReset()
    process.env = { ...originalEnv, RAINFOREST_API_KEY: 'test-key' }
    client = new RainforestClient()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('returns a normalized AmazonProduct on a happy-path response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        product: {
          asin: 'B084DWX1PV',
          title: 'Test Title',
          authors: [{ name: 'Test Author' }],
          description: 'Test description',
          publication_date: '2024-01-15',
          main_image: { link: 'https://example.com/cover.jpg' },
          categories: [{ name: 'Fiction' }],
          isbn: '0451524934',
          isbn_13: '9780451524935',
          publisher: 'Test Publisher',
          book_description: { pages: 320 }
        }
      })
    })

    const result = await client.getProductByAsin('B084DWX1PV')

    expect(result).not.toBeNull()
    expect(result?.asin).toBe('B084DWX1PV')
    expect(result?.title).toBe('Test Title')
    expect(result?.authors).toEqual(['Test Author'])
    expect(result?.description).toBe('Test description')
    expect(result?.publishedDate).toBe('2024-01-15')
    expect(result?.imageUrl).toBe('https://example.com/cover.jpg')
    expect(result?.categories).toEqual(['Fiction'])
    expect(result?.isbn10).toBe('0451524934')
    expect(result?.isbn13).toBe('9780451524935')
    expect(result?.publisher).toBe('Test Publisher')
    expect(result?.pageCount).toBe(320)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('api.rainforestapi.com/request')
    expect(url).toContain('api_key=test-key')
    expect(url).toContain('type=product')
    expect(url).toContain('amazon_domain=amazon.com')
    expect(url).toContain('asin=B084DWX1PV')
  })

  test('returns null when RAINFOREST_API_KEY is missing', async () => {
    process.env = { ...originalEnv }
    delete process.env.RAINFOREST_API_KEY
    const clientWithoutKey = new RainforestClient()

    const result = await clientWithoutKey.getProductByAsin('B084DWX1PV')

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('returns null on HTTP error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({})
    })

    const result = await client.getProductByAsin('B084DWX1PV')

    expect(result).toBeNull()
  })

  test('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await client.getProductByAsin('B084DWX1PV')

    expect(result).toBeNull()
  })

  test('returns null when response has no product field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    })

    const result = await client.getProductByAsin('B084DWX1PV')

    expect(result).toBeNull()
  })

  test('handles missing optional fields gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        product: {
          asin: 'B084DWX1PV',
          title: 'Sparse Title'
        }
      })
    })

    const result = await client.getProductByAsin('B084DWX1PV')

    expect(result).not.toBeNull()
    expect(result?.asin).toBe('B084DWX1PV')
    expect(result?.title).toBe('Sparse Title')
    expect(result?.authors).toEqual([])
    expect(result?.categories).toEqual([])
    expect(result?.description).toBeUndefined()
    expect(result?.isbn10).toBeUndefined()
    expect(result?.isbn13).toBeUndefined()
    expect(result?.publisher).toBeUndefined()
    expect(result?.pageCount).toBeUndefined()
  })
})
