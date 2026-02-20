/**
 * Tests for ISBN validation utility
 * Task Group 1.1: ISBN validation tests
 */
import { validateAndNormalizeIsbn } from '@/lib/search/utils/isbnValidator'

describe('validateAndNormalizeIsbn', () => {
  test('should strip hyphens and return normalized ISBN', () => {
    // Input with hyphens should be normalized to digits only
    expect(validateAndNormalizeIsbn('979-8351548678')).toBe('9798351548678')
    expect(validateAndNormalizeIsbn('978-0-123-45678-9')).toBe('9780123456789')
  })

  test('should return normalized string for valid 10-digit ISBN', () => {
    expect(validateAndNormalizeIsbn('0123456789')).toBe('0123456789')
    expect(validateAndNormalizeIsbn('0-123-45678-9')).toBe('0123456789')
  })

  test('should return normalized string for valid 13-digit ISBN', () => {
    expect(validateAndNormalizeIsbn('9780123456789')).toBe('9780123456789')
    expect(validateAndNormalizeIsbn('9798351548678')).toBe('9798351548678')
  })

  test('should return null for invalid ISBN formats', () => {
    // Contains letters
    expect(validateAndNormalizeIsbn('978012345678X')).toBeNull()
    expect(validateAndNormalizeIsbn('abcdefghij')).toBeNull()

    // Wrong length (not 10 or 13 digits)
    expect(validateAndNormalizeIsbn('12345')).toBeNull()
    expect(validateAndNormalizeIsbn('123456789012')).toBeNull() // 12 digits
    expect(validateAndNormalizeIsbn('12345678901234')).toBeNull() // 14 digits

    // Empty input
    expect(validateAndNormalizeIsbn('')).toBeNull()

    // Only hyphens
    expect(validateAndNormalizeIsbn('---')).toBeNull()
  })
})
