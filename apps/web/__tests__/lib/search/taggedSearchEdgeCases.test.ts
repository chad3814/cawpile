/**
 * Edge case tests for tagged search feature
 * Task Group 7.3: Additional strategic tests for critical edge cases
 */
import { parseTaggedSearch } from '@/lib/search/utils/tagParser'
import { validateAndNormalizeIsbn } from '@/lib/search/utils/isbnValidator'
import { handleTaggedSearch } from '@/lib/search/handlers/taggedSearchHandler'
import { IbdbClient } from '@/lib/search/utils/ibdbClient'
import { HardcoverClient } from '@/lib/search/utils/hardcoverClient'
import * as googleBooks from '@/lib/googleBooks'

// Mock the clients and modules
jest.mock('@/lib/search/utils/ibdbClient')
jest.mock('@/lib/search/utils/hardcoverClient')
jest.mock('@/lib/googleBooks')

const MockedIbdbClient = IbdbClient as jest.MockedClass<typeof IbdbClient>
const MockedHardcoverClient = HardcoverClient as jest.MockedClass<typeof HardcoverClient>
const mockedGoogleBooks = googleBooks as jest.Mocked<typeof googleBooks>

describe('Tagged Search Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Empty value after tag colon', () => {
    test('parseTaggedSearch should not match tag with empty value', () => {
      // The regex requires at least one character after the colon
      expect(parseTaggedSearch('ibdb:')).toBeNull()
      expect(parseTaggedSearch('hard:')).toBeNull()
      expect(parseTaggedSearch('isbn:')).toBeNull()
    })

    test('handleTaggedSearch handles empty value gracefully', async () => {
      // Even if we call with empty value, it should handle gracefully
      MockedIbdbClient.prototype.getBookById = jest.fn().mockResolvedValueOnce(null)

      const result = await handleTaggedSearch('ibdb', '')

      expect(result.taggedSearch).toBe(true)
      expect(result.books).toEqual([])
      // Should return null from client since empty uuid
    })
  })

  describe('Whitespace handling around tags', () => {
    test('parseTaggedSearch handles leading whitespace correctly', () => {
      // Leading whitespace should prevent tag detection (tag must be at start)
      expect(parseTaggedSearch(' ibdb:uuid')).toBeNull()
      expect(parseTaggedSearch('  hard:12345')).toBeNull()
    })

    test('parseTaggedSearch preserves whitespace in value', () => {
      // Whitespace after colon should be part of value
      const result = parseTaggedSearch('ibdb: uuid with spaces')
      expect(result).toEqual({ tag: 'ibdb', value: ' uuid with spaces' })
    })
  })

  describe('ISBN format edge cases', () => {
    test('validateAndNormalizeIsbn handles multiple consecutive hyphens', () => {
      expect(validateAndNormalizeIsbn('978--0-123-456789')).toBe('9780123456789')
      expect(validateAndNormalizeIsbn('---9780123456789---')).toBe('9780123456789')
    })

    test('validateAndNormalizeIsbn rejects ISBN with spaces', () => {
      expect(validateAndNormalizeIsbn('978 0123456789')).toBeNull()
    })

    test('validateAndNormalizeIsbn handles edge case lengths', () => {
      // Exactly 9 digits (invalid)
      expect(validateAndNormalizeIsbn('123456789')).toBeNull()
      // Exactly 11 digits (invalid)
      expect(validateAndNormalizeIsbn('12345678901')).toBeNull()
    })
  })

  describe('Hardcover ID validation', () => {
    test('handleTaggedSearch rejects non-numeric Hardcover ID', async () => {
      const result = await handleTaggedSearch('hard', 'not-a-number')

      expect(result.taggedSearch).toBe(true)
      expect(result.provider).toBe('hardcover')
      expect(result.books).toEqual([])
      expect(result.error).toContain('Invalid Hardcover ID')
    })

    test('handleTaggedSearch rejects negative Hardcover ID', async () => {
      const result = await handleTaggedSearch('hard', '-12345')

      expect(result.taggedSearch).toBe(true)
      expect(result.books).toEqual([])
      expect(result.error).toContain('Invalid Hardcover ID')
    })

    test('handleTaggedSearch rejects zero Hardcover ID', async () => {
      const result = await handleTaggedSearch('hard', '0')

      expect(result.taggedSearch).toBe(true)
      expect(result.books).toEqual([])
      expect(result.error).toContain('Invalid Hardcover ID')
    })
  })

  describe('Unknown tag type handling', () => {
    test('handleTaggedSearch handles unknown tag type gracefully', async () => {
      const result = await handleTaggedSearch('unknown', 'value')

      expect(result.taggedSearch).toBe(true)
      expect(result.provider).toBe('unknown')
      expect(result.books).toEqual([])
      expect(result.error).toContain('Unknown tag type')
    })
  })

  describe('ISBN search with all providers failing', () => {
    test('handleTaggedSearch returns appropriate error when all ISBN searches fail', async () => {
      // All providers return empty results
      MockedIbdbClient.prototype.search = jest.fn().mockResolvedValueOnce([])
      MockedHardcoverClient.prototype.search = jest.fn().mockResolvedValueOnce([])
      mockedGoogleBooks.searchBooks.mockResolvedValueOnce([])

      const result = await handleTaggedSearch('isbn', '9780123456789')

      expect(result.taggedSearch).toBe(true)
      expect(result.provider).toBe('isbn')
      expect(result.books).toEqual([])
      expect(result.error).toContain('No books found with ISBN')
    })
  })
})
