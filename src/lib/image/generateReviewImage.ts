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
 * Converts a data URL to a Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

/**
 * Triggers a browser download of an image from a data URL.
 * Uses the Web Share API on mobile browsers (where the `download` attribute
 * on anchor elements is not supported), and falls back to anchor download
 * on desktop browsers.
 */
export async function downloadImage(dataUrl: string, filename: string): Promise<void> {
  const blob = dataUrlToBlob(dataUrl)

  // Use Web Share API if available (works on mobile Safari, Chrome, etc.)
  if (navigator.share) {
    const file = new File([blob], filename, { type: 'image/png' })
    try {
      await navigator.share({
        files: [file],
        title: filename,
      })
      return
    } catch (err) {
      // User cancelled share or share failed — fall through to anchor download
      if (err instanceof Error && err.name === 'AbortError') {
        return // User deliberately cancelled
      }
    }
  }

  // Fallback: anchor download (works on desktop browsers)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Generates the filename for a shareable review image.
 */
export function generateImageFilename(bookTitle: string): string {
  const slug = slugifyBookTitle(bookTitle)
  return `cawpile-review-${slug}.png`
}

/**
 * Converts an image URL to a base64 data URL.
 * Uses a canvas to draw the image and extract the data URL.
 * Returns null if the image fails to load (e.g., CORS issues).
 */
export async function imageUrlToDataUrl(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0)
        const dataUrl = canvas.toDataURL('image/png')
        resolve(dataUrl)
      } catch {
        // Canvas tainted by CORS - return null
        resolve(null)
      }
    }

    img.onerror = () => {
      resolve(null)
    }

    // Add cache buster to avoid stale CORS issues
    img.src = imageUrl
  })
}
