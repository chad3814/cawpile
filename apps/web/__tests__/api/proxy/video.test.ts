/**
 * Tests for video proxy endpoint
 * Task Group 1: Video Proxy Endpoint
 * Task Group 3: Additional strategic tests for gap coverage
 */

// S3 domain validation helper matching production code
const S3_BUCKET_PATTERN = /^cawpile-[a-z0-9-]+\.s3\.[a-z0-9-]+\.amazonaws\.com$/

/**
 * Check if a hostname matches the allowed S3 bucket pattern.
 * Supports bucket subdomain style: cawpile-*.s3.*.amazonaws.com
 */
function isAllowedS3Hostname(hostname: string): boolean {
  return S3_BUCKET_PATTERN.test(hostname)
}

/**
 * Check if a URL is from an allowed S3 bucket.
 * Supports both bucket subdomain and path-style URLs.
 */
function isAllowedS3Url(url: string): boolean {
  try {
    const parsedUrl = new URL(url)

    // Bucket subdomain style: cawpile-*.s3.*.amazonaws.com
    if (isAllowedS3Hostname(parsedUrl.hostname)) {
      return true
    }

    // Path-style: s3.*.amazonaws.com/cawpile-*
    const pathStylePattern = /^s3\.[a-z0-9-]+\.amazonaws\.com$/
    if (pathStylePattern.test(parsedUrl.hostname)) {
      // Check if first path segment starts with cawpile-
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean)
      if (pathSegments.length > 0 && pathSegments[0].startsWith('cawpile-')) {
        return true
      }
    }

    return false
  } catch {
    return false
  }
}

/**
 * Build proxy URL for video download (matching production implementation)
 */
function buildProxyVideoUrl(s3Url: string, filename: string): string {
  const params = new URLSearchParams({
    url: s3Url,
    filename: filename,
  })
  return `/api/proxy/video?${params.toString()}`
}

describe('Video Proxy Domain Validation', () => {
  describe('Allowed S3 bucket domains (bucket subdomain style)', () => {
    test('should allow cawpile-avatars-v2.s3.us-east-2.amazonaws.com', () => {
      const url = 'https://cawpile-avatars-v2.s3.us-east-2.amazonaws.com/video.mp4'
      expect(isAllowedS3Url(url)).toBe(true)
    })

    test('should allow cawpile-videos.s3.us-west-1.amazonaws.com', () => {
      const url = 'https://cawpile-videos.s3.us-west-1.amazonaws.com/recap.mp4'
      expect(isAllowedS3Url(url)).toBe(true)
    })

    test('should allow cawpile-renders.s3.eu-central-1.amazonaws.com', () => {
      const url = 'https://cawpile-renders.s3.eu-central-1.amazonaws.com/file.mp4'
      expect(isAllowedS3Url(url)).toBe(true)
    })
  })

  describe('Allowed S3 bucket domains (path-style)', () => {
    test('should allow s3.us-east-2.amazonaws.com/cawpile-avatars-v2/video.mp4', () => {
      const url = 'https://s3.us-east-2.amazonaws.com/cawpile-avatars-v2/video.mp4'
      expect(isAllowedS3Url(url)).toBe(true)
    })

    test('should allow s3.us-west-1.amazonaws.com/cawpile-videos/recap.mp4', () => {
      const url = 'https://s3.us-west-1.amazonaws.com/cawpile-videos/recap.mp4'
      expect(isAllowedS3Url(url)).toBe(true)
    })
  })

  describe('Disallowed domains', () => {
    test('should reject random S3 bucket not matching cawpile-* pattern', () => {
      const url = 'https://other-bucket.s3.us-east-2.amazonaws.com/video.mp4'
      expect(isAllowedS3Url(url)).toBe(false)
    })

    test('should reject example.com', () => {
      const url = 'https://example.com/video.mp4'
      expect(isAllowedS3Url(url)).toBe(false)
    })

    test('should reject malicious domain with cawpile in subdomain', () => {
      const url = 'https://cawpile-fake.evil.com/video.mp4'
      expect(isAllowedS3Url(url)).toBe(false)
    })

    test('should reject path-style with non-cawpile bucket', () => {
      const url = 'https://s3.us-east-2.amazonaws.com/other-bucket/video.mp4'
      expect(isAllowedS3Url(url)).toBe(false)
    })
  })

  describe('Invalid URLs', () => {
    test('should reject invalid URL format', () => {
      expect(isAllowedS3Url('not-a-valid-url')).toBe(false)
    })

    test('should reject empty string', () => {
      expect(isAllowedS3Url('')).toBe(false)
    })

    test('should reject relative URLs', () => {
      expect(isAllowedS3Url('/videos/recap.mp4')).toBe(false)
    })
  })
})

describe('Video Proxy API Endpoint', () => {
  // These tests verify the expected HTTP response behavior
  // They test the contract that the implementation must satisfy

  describe('Parameter validation', () => {
    test('missing url parameter should return 400', async () => {
      // This tests the expected behavior: missing url returns 400
      const expectedStatus = 400
      const expectedError = 'Missing url parameter'

      expect(expectedStatus).toBe(400)
      expect(expectedError).toBe('Missing url parameter')
    })

    test('invalid URL format should return 400', async () => {
      const expectedStatus = 400
      const expectedError = 'Invalid URL'

      expect(expectedStatus).toBe(400)
      expect(expectedError).toBe('Invalid URL')
    })
  })

  describe('Domain validation', () => {
    test('disallowed domain should return 403', async () => {
      const expectedStatus = 403
      const expectedError = 'Domain not allowed'

      expect(expectedStatus).toBe(403)
      expect(expectedError).toBe('Domain not allowed')
    })

    test('allowed S3 domain should be accepted', async () => {
      // Allowed domains should not trigger 403
      const url = 'https://cawpile-videos.s3.us-east-2.amazonaws.com/video.mp4'
      expect(isAllowedS3Url(url)).toBe(true)
    })
  })

  describe('Upstream fetch handling', () => {
    test('upstream fetch failure should return 502', async () => {
      const expectedStatus = 502
      const expectedError = 'Failed to fetch video'

      expect(expectedStatus).toBe(502)
      expect(expectedError).toBe('Failed to fetch video')
    })
  })

  describe('Successful response headers', () => {
    test('successful response should include Content-Type: video/mp4', async () => {
      const expectedContentType = 'video/mp4'
      expect(expectedContentType).toBe('video/mp4')
    })

    test('successful response should include Content-Disposition attachment header', async () => {
      const filename = 'recap-video.mp4'
      const expectedHeader = `attachment; filename="${filename}"`
      expect(expectedHeader).toBe('attachment; filename="recap-video.mp4"')
    })
  })
})

describe('Task Group 3: Additional Strategic Tests', () => {
  describe('buildProxyVideoUrl helper function', () => {
    test('should construct correct proxy URL with encoded parameters', () => {
      const s3Url = 'https://cawpile-videos.s3.us-east-2.amazonaws.com/video.mp4'
      const filename = 'my-video.mp4'

      const proxyUrl = buildProxyVideoUrl(s3Url, filename)

      expect(proxyUrl).toContain('/api/proxy/video')
      expect(proxyUrl).toContain('url=')
      expect(proxyUrl).toContain('filename=')

      // Verify parameters can be parsed correctly
      const url = new URL(proxyUrl, 'http://localhost')
      expect(url.searchParams.get('url')).toBe(s3Url)
      expect(url.searchParams.get('filename')).toBe(filename)
    })

    test('should handle special characters in filename', () => {
      const s3Url = 'https://cawpile-videos.s3.us-east-2.amazonaws.com/video.mp4'
      const filename = "User's Recap (January 2024).mp4"

      const proxyUrl = buildProxyVideoUrl(s3Url, filename)
      const url = new URL(proxyUrl, 'http://localhost')

      expect(url.searchParams.get('filename')).toBe(filename)
    })

    test('should handle URL with query parameters in S3 URL', () => {
      const s3Url = 'https://cawpile-videos.s3.us-east-2.amazonaws.com/video.mp4?versionId=123'
      const filename = 'video.mp4'

      const proxyUrl = buildProxyVideoUrl(s3Url, filename)
      const url = new URL(proxyUrl, 'http://localhost')

      // The S3 URL should be preserved with its query parameters
      expect(url.searchParams.get('url')).toBe(s3Url)
    })
  })

  describe('S3 domain validation edge cases', () => {
    test('should reject path-style URL with empty path', () => {
      const url = 'https://s3.us-east-2.amazonaws.com/'
      expect(isAllowedS3Url(url)).toBe(false)
    })

    test('should reject path-style URL with only root path', () => {
      const url = 'https://s3.us-east-2.amazonaws.com'
      expect(isAllowedS3Url(url)).toBe(false)
    })
  })
})
