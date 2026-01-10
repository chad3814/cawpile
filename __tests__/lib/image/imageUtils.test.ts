/**
 * Tests for image generation utility functions
 * Task Group 1.1: Utility layer tests
 */
import {
  slugifyBookTitle,
  truncateReviewText,
  generateImageFilename,
} from '@/lib/image/generateReviewImage'
import { getScoreColor, SCORE_COLORS } from '@/lib/image/imageTheme'

describe('slugifyBookTitle', () => {
  test('should convert basic title to lowercase hyphenated slug', () => {
    expect(slugifyBookTitle('The Great Gatsby')).toBe('the-great-gatsby')
  })

  test('should handle special characters and punctuation', () => {
    // Apostrophes become hyphens since they're non-alphanumeric
    expect(slugifyBookTitle("Harry Potter & the Sorcerer's Stone")).toBe('harry-potter-the-sorcerer-s-stone')
  })

  test('should handle accented characters', () => {
    expect(slugifyBookTitle('Les Miserables')).toBe('les-miserables')
    expect(slugifyBookTitle('Cafe')).toBe('cafe')
  })

  test('should remove multiple consecutive hyphens', () => {
    expect(slugifyBookTitle('Book   With   Spaces')).toBe('book-with-spaces')
    expect(slugifyBookTitle('Book---With---Hyphens')).toBe('book-with-hyphens')
  })

  test('should trim leading and trailing hyphens', () => {
    expect(slugifyBookTitle('  Book Title  ')).toBe('book-title')
    expect(slugifyBookTitle('---Book---')).toBe('book')
  })

  test('should limit slug length to 50 characters', () => {
    const longTitle = 'A Very Long Book Title That Goes On And On And On And On Forever'
    const slug = slugifyBookTitle(longTitle)
    expect(slug.length).toBeLessThanOrEqual(50)
  })

  test('should handle empty string', () => {
    expect(slugifyBookTitle('')).toBe('')
  })
})

describe('truncateReviewText', () => {
  test('should return empty string for null or undefined input', () => {
    expect(truncateReviewText(null, 100)).toBe('')
    expect(truncateReviewText(undefined, 100)).toBe('')
  })

  test('should return original text if under max chars', () => {
    const text = 'Short review text'
    expect(truncateReviewText(text, 100)).toBe(text)
  })

  test('should truncate at word boundary with ellipsis', () => {
    const text = 'This is a longer review that needs to be truncated at some point'
    const result = truncateReviewText(text, 30)
    expect(result.endsWith('...')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(33) // 30 + "..."
  })

  test('should handle text with no spaces (single long word)', () => {
    const text = 'Supercalifragilisticexpialidocious and more text here'
    const result = truncateReviewText(text, 35)
    expect(result.endsWith('...')).toBe(true)
  })

  test('should trim whitespace from input', () => {
    const text = '  Some text with whitespace  '
    expect(truncateReviewText(text, 100)).toBe('Some text with whitespace')
  })
})

describe('generateImageFilename', () => {
  test('should generate correct filename format', () => {
    expect(generateImageFilename('The Great Gatsby')).toBe('cawpile-review-the-great-gatsby.png')
  })

  test('should handle special characters in title', () => {
    // Tests that special chars are handled and filename has correct format
    const filename = generateImageFilename("Harry Potter & the Sorcerer's Stone")
    expect(filename.startsWith('cawpile-review-')).toBe(true)
    expect(filename.endsWith('.png')).toBe(true)
    expect(filename).toContain('harry-potter')
  })
})

describe('getScoreColor', () => {
  test('should return excellent color for scores >= 8', () => {
    expect(getScoreColor(8)).toBe(SCORE_COLORS.excellent)
    expect(getScoreColor(9)).toBe(SCORE_COLORS.excellent)
    expect(getScoreColor(10)).toBe(SCORE_COLORS.excellent)
  })

  test('should return good color for scores 6-7', () => {
    expect(getScoreColor(6)).toBe(SCORE_COLORS.good)
    expect(getScoreColor(7)).toBe(SCORE_COLORS.good)
    expect(getScoreColor(7.9)).toBe(SCORE_COLORS.good)
  })

  test('should return average color for scores 4-5', () => {
    expect(getScoreColor(4)).toBe(SCORE_COLORS.average)
    expect(getScoreColor(5)).toBe(SCORE_COLORS.average)
    expect(getScoreColor(5.9)).toBe(SCORE_COLORS.average)
  })

  test('should return poor color for scores < 4', () => {
    expect(getScoreColor(1)).toBe(SCORE_COLORS.poor)
    expect(getScoreColor(2)).toBe(SCORE_COLORS.poor)
    expect(getScoreColor(3)).toBe(SCORE_COLORS.poor)
    expect(getScoreColor(3.9)).toBe(SCORE_COLORS.poor)
  })
})
