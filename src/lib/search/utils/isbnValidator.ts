/**
 * ISBN validation and normalization utility
 * Validates and normalizes ISBN-10 and ISBN-13 formats
 */

/**
 * Validates and normalizes an ISBN string
 * Strips hyphens and validates that the result is exactly 10 or 13 digits
 *
 * @param input - The ISBN string to validate (may contain hyphens)
 * @returns The normalized ISBN (digits only) or null if invalid
 */
export function validateAndNormalizeIsbn(input: string): string | null {
  if (!input) {
    return null
  }

  // Strip all hyphens from input
  const normalized = input.replace(/-/g, '')

  // Check that all remaining characters are digits
  if (!/^\d+$/.test(normalized)) {
    return null
  }

  // Validate length is exactly 10 or 13 digits
  if (normalized.length !== 10 && normalized.length !== 13) {
    return null
  }

  return normalized
}
