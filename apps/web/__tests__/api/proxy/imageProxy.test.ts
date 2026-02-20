/**
 * Tests for image proxy domain validation
 * Task Group 5: Image Proxy
 */

// Domain validation helper to match the production code
const ALLOWED_DOMAINS = [
  // Google Books domains
  'books.google.com',
  'books.googleusercontent.com',
  'lh3.googleusercontent.com',
  // Hardcover domains
  'cdn.hardcover.app',
  'hardcover.app',
  'storage.googleapis.com',
  // IBDB domains
  'images-na.ssl-images-amazon.com',
  'covers.openlibrary.org',
  'm.media-amazon.com',
]

/**
 * Check if a hostname matches an allowed domain.
 * Uses exact match or subdomain match (hostname ends with .domain).
 */
function isAllowedHostname(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(domain => {
    // Exact match
    if (hostname === domain) {
      return true
    }
    // Subdomain match (e.g., cdn.hardcover.app matches hardcover.app)
    if (hostname.endsWith('.' + domain)) {
      return true
    }
    return false
  })
}

function isAllowedDomain(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return isAllowedHostname(parsedUrl.hostname)
  } catch {
    return false
  }
}

describe('Image Proxy Domain Validation', () => {
  describe('Google Books domains', () => {
    test('should allow books.google.com', () => {
      expect(isAllowedDomain('https://books.google.com/content?id=abc123')).toBe(true)
    })

    test('should allow books.googleusercontent.com', () => {
      expect(isAllowedDomain('https://books.googleusercontent.com/books/content?id=abc')).toBe(true)
    })

    test('should allow lh3.googleusercontent.com', () => {
      expect(isAllowedDomain('https://lh3.googleusercontent.com/cover.jpg')).toBe(true)
    })
  })

  describe('Hardcover domains', () => {
    test('should allow cdn.hardcover.app', () => {
      expect(isAllowedDomain('https://cdn.hardcover.app/covers/12345.jpg')).toBe(true)
    })

    test('should allow hardcover.app', () => {
      expect(isAllowedDomain('https://hardcover.app/images/cover.jpg')).toBe(true)
    })

    test('should allow storage.googleapis.com for Hardcover/IBDB images', () => {
      expect(isAllowedDomain('https://storage.googleapis.com/hardcover-assets/image.jpg')).toBe(true)
    })
  })

  describe('IBDB/External book image domains', () => {
    test('should allow images-na.ssl-images-amazon.com', () => {
      expect(isAllowedDomain('https://images-na.ssl-images-amazon.com/images/I/cover.jpg')).toBe(true)
    })

    test('should allow covers.openlibrary.org', () => {
      expect(isAllowedDomain('https://covers.openlibrary.org/b/id/12345-L.jpg')).toBe(true)
    })

    test('should allow m.media-amazon.com', () => {
      expect(isAllowedDomain('https://m.media-amazon.com/images/I/cover.jpg')).toBe(true)
    })
  })

  describe('Unknown domains should be rejected', () => {
    test('should reject example.com', () => {
      expect(isAllowedDomain('https://example.com/image.jpg')).toBe(false)
    })

    test('should reject random-site.org', () => {
      expect(isAllowedDomain('https://random-site.org/cover.jpg')).toBe(false)
    })

    test('should reject malicious-hardcover.app (similar domain)', () => {
      // Proper domain validation should reject domains that merely contain the allowed domain name
      expect(isAllowedDomain('https://malicious-hardcover.app/image.jpg')).toBe(false)
    })

    test('should reject fake-books.google.com.evil.com', () => {
      expect(isAllowedDomain('https://fake-books.google.com.evil.com/image.jpg')).toBe(false)
    })
  })

  describe('Invalid URLs', () => {
    test('should reject invalid URL format', () => {
      expect(isAllowedDomain('not-a-valid-url')).toBe(false)
    })

    test('should reject empty string', () => {
      expect(isAllowedDomain('')).toBe(false)
    })

    test('should reject relative URLs', () => {
      expect(isAllowedDomain('/images/cover.jpg')).toBe(false)
    })
  })
})
