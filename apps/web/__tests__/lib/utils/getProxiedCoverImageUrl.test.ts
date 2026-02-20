/**
 * Tests for getProxiedCoverImageUrl utility
 * Task Group 5: Image Proxy - Proxy-aware cover URL helper
 */
import { getProxiedCoverImageUrl } from '@/lib/utils/getProxiedCoverImageUrl'
import { EditionWithProviders } from '@/lib/utils/getCoverImageUrl'

describe('getProxiedCoverImageUrl', () => {
  const mockEdition: EditionWithProviders = {
    hardcoverBook: { imageUrl: 'https://hardcover.app/cover1.jpg' },
    googleBook: { imageUrl: 'https://books.google.com/cover2.jpg' },
    ibdbBook: { imageUrl: 'https://ibdb.dev/cover3.jpg' },
  }

  describe('without proxy (shouldProxy = false)', () => {
    test('should return cover URL without proxy wrapper', () => {
      const result = getProxiedCoverImageUrl(mockEdition, null, false)
      expect(result).toBe('https://hardcover.app/cover1.jpg')
      expect(result).not.toContain('/api/proxy/image')
    })

    test('should default to not proxying when shouldProxy is not provided', () => {
      const result = getProxiedCoverImageUrl(mockEdition)
      expect(result).toBe('https://hardcover.app/cover1.jpg')
      expect(result).not.toContain('/api/proxy/image')
    })

    test('should respect preferred provider without proxy', () => {
      const result = getProxiedCoverImageUrl(mockEdition, 'google', false)
      expect(result).toBe('https://books.google.com/cover2.jpg')
    })
  })

  describe('with proxy (shouldProxy = true)', () => {
    test('should return proxied URL when shouldProxy is true', () => {
      const result = getProxiedCoverImageUrl(mockEdition, null, true)
      expect(result).toBe('/api/proxy/image?url=https%3A%2F%2Fhardcover.app%2Fcover1.jpg')
    })

    test('should respect preferred provider with proxy', () => {
      const result = getProxiedCoverImageUrl(mockEdition, 'google', true)
      expect(result).toBe('/api/proxy/image?url=https%3A%2F%2Fbooks.google.com%2Fcover2.jpg')
    })

    test('should properly encode URL parameters', () => {
      const editionWithSpecialChars: EditionWithProviders = {
        hardcoverBook: { imageUrl: 'https://hardcover.app/cover?id=123&size=large' },
        googleBook: null,
        ibdbBook: null,
      }
      const result = getProxiedCoverImageUrl(editionWithSpecialChars, null, true)
      expect(result).toContain('/api/proxy/image?url=')
      expect(result).toContain(encodeURIComponent('https://hardcover.app/cover?id=123&size=large'))
    })
  })

  describe('when no cover is available', () => {
    test('should return undefined when all providers are null', () => {
      const noCoversEdition: EditionWithProviders = {
        hardcoverBook: null,
        googleBook: null,
        ibdbBook: null,
      }
      const result = getProxiedCoverImageUrl(noCoversEdition, null, true)
      expect(result).toBeUndefined()
    })

    test('should return undefined when all provider imageUrls are null', () => {
      const nullImageUrlsEdition: EditionWithProviders = {
        hardcoverBook: { imageUrl: null },
        googleBook: { imageUrl: null },
        ibdbBook: { imageUrl: null },
      }
      const result = getProxiedCoverImageUrl(nullImageUrlsEdition, null, false)
      expect(result).toBeUndefined()
    })
  })
})
