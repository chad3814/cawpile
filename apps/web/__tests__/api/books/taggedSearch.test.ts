/**
 * Tests for tagged search API handling
 * Task Group 5.1: Tagged search API tests
 */
import { handleTaggedSearch } from '@/lib/search/handlers/taggedSearchHandler'
import { IbdbClient } from '@/lib/search/utils/ibdbClient'
import { HardcoverClient } from '@/lib/search/utils/hardcoverClient'
import * as googleBooks from '@/lib/googleBooks'

// Mock the clients and googleBooks module
jest.mock('@/lib/search/utils/ibdbClient')
jest.mock('@/lib/search/utils/hardcoverClient')
jest.mock('@/lib/googleBooks')

const MockedIbdbClient = IbdbClient as jest.MockedClass<typeof IbdbClient>
const MockedHardcoverClient = HardcoverClient as jest.MockedClass<typeof HardcoverClient>
const mockedGoogleBooks = googleBooks as jest.Mocked<typeof googleBooks>

describe('handleTaggedSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return book with taggedSearch: true and provider: "ibdb" for ibdb: tag', async () => {
    const mockBook = {
      id: 'test-uuid',
      title: 'Test Book',
      authors: ['Test Author'],
      isbn13: '9780123456789',
      description: 'A test book',
      pageCount: 300,
      imageUrl: 'https://example.com/cover.jpg',
      categories: ['Fiction']
    }

    MockedIbdbClient.prototype.getBookById = jest.fn().mockResolvedValueOnce(mockBook)

    const result = await handleTaggedSearch('ibdb', 'test-uuid')

    expect(result.taggedSearch).toBe(true)
    expect(result.provider).toBe('ibdb')
    expect(result.books.length).toBe(1)
    expect(result.books[0].title).toBe('Test Book')
    expect(result.error).toBeUndefined()
  })

  test('should return book with taggedSearch: true and provider: "hardcover" for hard: tag', async () => {
    const mockBook = {
      id: 12345,
      title: 'Hardcover Book',
      author_names: ['Hardcover Author'],
      isbns: ['9780123456789'],
      description: 'A hardcover book',
      pages: 400,
      image: { url: 'https://hardcover.app/cover.jpg' },
      genres: ['Fantasy']
    }

    MockedHardcoverClient.prototype.getBookById = jest.fn().mockResolvedValueOnce(mockBook)

    const result = await handleTaggedSearch('hard', '12345')

    expect(result.taggedSearch).toBe(true)
    expect(result.provider).toBe('hardcover')
    expect(result.books.length).toBe(1)
    expect(result.books[0].title).toBe('Hardcover Book')
    expect(result.error).toBeUndefined()
  })

  test('should return book with taggedSearch: true and provider: "google" for gbid: tag', async () => {
    const mockBook = {
      id: 'google-book-id',
      googleId: 'google-book-id',
      title: 'Google Book',
      authors: ['Google Author'],
      isbn13: '9780123456789',
      description: 'A Google book',
      pageCount: 250,
      imageUrl: 'https://books.google.com/cover.jpg',
      categories: ['Science']
    }

    mockedGoogleBooks.getBookById.mockResolvedValueOnce(mockBook)

    const result = await handleTaggedSearch('gbid', 'google-book-id')

    expect(result.taggedSearch).toBe(true)
    expect(result.provider).toBe('google')
    expect(result.books.length).toBe(1)
    expect(result.books[0].title).toBe('Google Book')
    expect(result.error).toBeUndefined()
  })

  test('should search multiple providers for isbn: tag', async () => {
    // Mock IBDb search
    MockedIbdbClient.prototype.search = jest.fn().mockResolvedValueOnce([{
      id: 'ibdb-id',
      title: 'ISBN Book from IBDb',
      authors: ['Author'],
      isbn13: '9780123456789'
    }])

    // Mock Hardcover search
    MockedHardcoverClient.prototype.search = jest.fn().mockResolvedValueOnce([{
      id: 123,
      title: 'ISBN Book from Hardcover',
      author_names: ['Author'],
      isbns: ['9780123456789']
    }])

    // Mock Google Books search
    mockedGoogleBooks.searchBooks.mockResolvedValueOnce([{
      id: 'google-id',
      googleId: 'google-id',
      title: 'ISBN Book from Google',
      authors: ['Author'],
      isbn13: '9780123456789',
      categories: []
    }])

    const result = await handleTaggedSearch('isbn', '9780123456789')

    expect(result.taggedSearch).toBe(true)
    expect(result.provider).toBe('isbn')
    expect(result.books.length).toBeGreaterThan(0)
    expect(result.error).toBeUndefined()
  })

  test('should return error message with provider name when book not found', async () => {
    MockedIbdbClient.prototype.getBookById = jest.fn().mockResolvedValueOnce(null)

    const result = await handleTaggedSearch('ibdb', 'non-existent-uuid')

    expect(result.taggedSearch).toBe(true)
    expect(result.provider).toBe('ibdb')
    expect(result.books).toEqual([])
    expect(result.error).toBe('Book not found with ID non-existent-uuid on IBDb')
  })

  test('should validate ISBN format for isbn: tag and return error for invalid ISBN', async () => {
    const result = await handleTaggedSearch('isbn', 'invalid-isbn')

    expect(result.taggedSearch).toBe(true)
    expect(result.provider).toBe('isbn')
    expect(result.books).toEqual([])
    expect(result.error).toContain('Invalid ISBN format')
  })
})
