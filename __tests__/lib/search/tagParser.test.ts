/**
 * Tests for tag parser utility
 * Task Group 2.1: Tag parsing tests
 */
import { parseTaggedSearch } from '@/lib/search/utils/tagParser'

describe('parseTaggedSearch', () => {
  test('should parse ibdb: tag and return tag object', () => {
    const result = parseTaggedSearch('ibdb:uuid-here')
    expect(result).toEqual({ tag: 'ibdb', value: 'uuid-here' })
  })

  test('should parse uppercase HARD: tag case-insensitively', () => {
    const result = parseTaggedSearch('HARD:12345')
    expect(result).toEqual({ tag: 'hard', value: '12345' })
  })

  test('should parse isbn: tag and preserve hyphenated value', () => {
    const result = parseTaggedSearch('isbn:978-0-123-45678-9')
    expect(result).toEqual({ tag: 'isbn', value: '978-0-123-45678-9' })
  })

  test('should return null for regular query without tags', () => {
    const result = parseTaggedSearch('lord of the rings')
    expect(result).toBeNull()
  })

  test('should return null when tag is in middle of query (not at start)', () => {
    const result = parseTaggedSearch('search ibdb:123')
    expect(result).toBeNull()
  })

  test('should parse gbid: tag correctly', () => {
    const result = parseTaggedSearch('gbid:some-google-id')
    expect(result).toEqual({ tag: 'gbid', value: 'some-google-id' })
  })

  test('should handle mixed case tags', () => {
    expect(parseTaggedSearch('IbDb:uuid')).toEqual({ tag: 'ibdb', value: 'uuid' })
    expect(parseTaggedSearch('GbId:id123')).toEqual({ tag: 'gbid', value: 'id123' })
    expect(parseTaggedSearch('Isbn:9780123456789')).toEqual({ tag: 'isbn', value: '9780123456789' })
  })
})
