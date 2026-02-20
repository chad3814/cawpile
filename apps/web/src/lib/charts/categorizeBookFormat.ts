import { BookFormat } from '@prisma/client'

/**
 * Categorizes book formats based on the combination selected by the user.
 *
 * Category Priority (highest to lowest):
 * 1. Omni Dorking - 3 or more formats
 * 2. Double Dorking - AUDIOBOOK + (HARDCOVER OR PAPERBACK OR EBOOK), exactly 2 formats
 * 3. Four Eyes - (HARDCOVER OR PAPERBACK) + EBOOK (no audiobook), exactly 2 formats
 * 4. Single Format - Only one format, use format name
 *
 * @param formats - Array of BookFormat enums
 * @returns Category name string for chart display
 */
export function categorizeBookFormat(formats: BookFormat[]): string {
  // Handle edge cases
  if (!formats || formats.length === 0) {
    return 'Unknown'
  }

  // Remove duplicates
  const uniqueFormats = Array.from(new Set(formats))
  const count = uniqueFormats.length

  // Single format - return the format name
  if (count === 1) {
    const format = uniqueFormats[0]
    switch (format) {
      case BookFormat.HARDCOVER:
        return 'Hardcover'
      case BookFormat.PAPERBACK:
        return 'Paperback'
      case BookFormat.EBOOK:
        return 'E-book'
      case BookFormat.AUDIOBOOK:
        return 'Audiobook'
      default:
        return 'Unknown'
    }
  }

  // Omni Dorking - 3 or more formats
  if (count >= 3) {
    return 'Omni Dorking'
  }

  // At this point we have exactly 2 formats
  const hasAudiobook = uniqueFormats.includes(BookFormat.AUDIOBOOK)
  const hasHardcover = uniqueFormats.includes(BookFormat.HARDCOVER)
  const hasPaperback = uniqueFormats.includes(BookFormat.PAPERBACK)
  const hasEbook = uniqueFormats.includes(BookFormat.EBOOK)

  // Double Dorking - AUDIOBOOK + (HARDCOVER OR PAPERBACK OR EBOOK)
  if (hasAudiobook && (hasHardcover || hasPaperback || hasEbook)) {
    return 'Double Dorking'
  }

  // Four Eyes - (HARDCOVER OR PAPERBACK) + EBOOK (no audiobook)
  if (!hasAudiobook && hasEbook && (hasHardcover || hasPaperback)) {
    return 'Four Eyes'
  }

  // Edge case: HARDCOVER + PAPERBACK (2 physical formats, counts as Omni Dorking per spec)
  // Actually, reviewing the spec more carefully, this should be treated as 2 formats
  // Let me check the spec requirements again...
  // The spec says "Physical format variations (both HARDCOVER and PAPERBACK) are allowed and counted as 2+ formats"
  // And "More than two formats = Omni Dorking"
  // So HARDCOVER + PAPERBACK with exactly 2 formats should fall through to a default
  // But this seems like an edge case. Let me handle it as "Physical Books" for clarity
  if (hasHardcover && hasPaperback && count === 2) {
    return 'Physical Books'
  }

  // Fallback for any unexpected combination
  return 'Mixed Formats'
}
