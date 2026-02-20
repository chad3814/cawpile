/**
 * Tests for Hardcover client getBookById method
 * Task Group 4.1: Hardcover ID lookup tests
 */
import { HardcoverClient } from '@/lib/search/utils/hardcoverClient'

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Store original env
const originalEnv = process.env

describe('HardcoverClient.getBookById', () => {
  let client: HardcoverClient

  beforeEach(() => {
    // Reset mocks
    mockFetch.mockReset()
    // Set token for tests
    process.env = { ...originalEnv, HARDCOVER_TOKEN: 'test-token' }
    client = new HardcoverClient()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('should return HardcoverDocument for successful lookup', async () => {
    const mockBookResponse = {
      data: {
        books_by_pk: {
          id: 2013567,
          title: 'Test Book',
          description: 'A test book description',
          author_names: ['Test Author'],
          release_date: '2024-01-15',
          pages: 350,
          image: { url: 'https://hardcover.app/cover.jpg' },
          isbns: ['9780123456789'],
          genres: ['Fiction', 'Fantasy']
        }
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockBookResponse
    })

    const result = await client.getBookById(2013567)

    expect(result).not.toBeNull()
    expect(result?.id).toBe(2013567)
    expect(result?.title).toBe('Test Book')
    expect(result?.author_names).toEqual(['Test Author'])
    expect(result?.isbns).toEqual(['9780123456789'])

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.hardcover.app/v1/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        })
      })
    )
  })

  test('should return null for non-existent ID', async () => {
    const mockNotFoundResponse = {
      data: {
        books_by_pk: null
      }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockNotFoundResponse
    })

    const result = await client.getBookById(99999999)

    expect(result).toBeNull()
  })

  test('should return null gracefully when token is missing', async () => {
    // Remove the token
    process.env = { ...originalEnv }
    delete process.env.HARDCOVER_TOKEN

    // Create new client without token
    const clientWithoutToken = new HardcoverClient()

    const result = await clientWithoutToken.getBookById(12345)

    expect(result).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('should return null on API error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await client.getBookById(12345)

    expect(result).toBeNull()
  })

  test('should return null for invalid ID (negative or zero)', async () => {
    const result1 = await client.getBookById(0)
    const result2 = await client.getBookById(-1)

    expect(result1).toBeNull()
    expect(result2).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
