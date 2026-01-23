/**
 * Tests for IBDb client getBookById method
 * Task Group 3.1: IBDb ID lookup tests
 */
import { IbdbClient } from '@/lib/search/utils/ibdbClient'

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('IbdbClient.getBookById', () => {
  let client: IbdbClient

  beforeEach(() => {
    client = new IbdbClient()
    mockFetch.mockReset()
  })

  test('should return normalized IbdbBook for successful lookup', async () => {
    // API returns { status: 'ok', book: { ... } } format
    const mockBookResponse = {
      status: 'ok',
      book: {
        id: '610f49ed-f674-4689-93fb-e0215d4bb2c7',
        title: 'Test Book',
        authors: [{ name: 'Test Author' }],
        isbn10: '0123456789',
        isbn13: '9780123456789',
        synopsis: 'A test book description',  // API uses synopsis, not description
        publicationDate: '2024-01-15',        // API uses publicationDate, not publishedDate
        pageCount: 350,
        image: { url: 'https://example.com/cover.jpg' },  // API uses image.url, not imageUrl
        categories: ['Fiction', 'Fantasy']
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBookResponse
    })

    const result = await client.getBookById('610f49ed-f674-4689-93fb-e0215d4bb2c7')

    expect(result).not.toBeNull()
    expect(result?.id).toBe('610f49ed-f674-4689-93fb-e0215d4bb2c7')
    expect(result?.title).toBe('Test Book')
    expect(result?.authors).toEqual(['Test Author'])
    expect(result?.isbn13).toBe('9780123456789')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://ibdb.dev/api/book-json/610f49ed-f674-4689-93fb-e0215d4bb2c7',
      expect.objectContaining({
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
    )
  })

  test('should return null for non-existent ID (404 response)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const result = await client.getBookById('non-existent-uuid')

    expect(result).toBeNull()
  })

  test('should return null gracefully on API error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await client.getBookById('some-uuid')

    expect(result).toBeNull()
  })

  test('should handle empty UUID gracefully', async () => {
    const result = await client.getBookById('')

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
