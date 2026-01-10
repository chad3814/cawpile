/**
 * Utility functions for shareable review image generation.
 */

/**
 * Converts a book title to a URL-safe slug for use in filenames.
 * Removes special characters, converts to lowercase, and replaces spaces with hyphens.
 */
export function slugifyBookTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace accented characters with ASCII equivalents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace any non-alphanumeric characters (except hyphens) with hyphens
    .replace(/[^a-z0-9-]+/g, '-')
    // Remove consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
    // Limit length to avoid overly long filenames
    .slice(0, 50)
}

/**
 * Truncates review text to a maximum character count, adding ellipsis if truncated.
 * Attempts to break at word boundaries to avoid cutting words in half.
 */
export function truncateReviewText(text: string | null | undefined, maxChars: number): string {
  if (!text) return ''

  const trimmed = text.trim()
  if (trimmed.length <= maxChars) return trimmed

  // Find the last space before maxChars to avoid cutting words
  const truncated = trimmed.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')

  // If there's a space within the last 20% of the string, break there
  if (lastSpace > maxChars * 0.8) {
    return truncated.slice(0, lastSpace) + '...'
  }

  // Otherwise, just truncate at maxChars
  return truncated + '...'
}

/**
 * Triggers a browser download of an image from a data URL.
 * Works on both desktop and mobile browsers.
 */
export function downloadImage(dataUrl: string, filename: string): void {
  // Create a temporary anchor element
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename

  // Append to body (required for Firefox)
  document.body.appendChild(link)

  // Trigger download
  link.click()

  // Clean up
  document.body.removeChild(link)
}

/**
 * Generates the filename for a shareable review image.
 */
export function generateImageFilename(bookTitle: string): string {
  const slug = slugifyBookTitle(bookTitle)
  return `cawpile-review-${slug}.png`
}
