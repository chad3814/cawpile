/**
 * Tests for getCoverImageUrl utility function
 * Task Group 1.1: Utility layer tests
 */
import { getCoverImageUrl, EditionWithProviders } from '@/lib/utils/getCoverImageUrl'

describe('getCoverImageUrl', () => {
  test('should return Hardcover imageUrl when all providers are present', () => {
    const edition: EditionWithProviders = {
      hardcoverBook: { imageUrl: 'https://hardcover.app/cover.jpg' },
      googleBook: { imageUrl: 'https://books.google.com/cover.jpg' },
      ibdbBook: { imageUrl: 'https://ibdb.com/cover.jpg' }
    }

    expect(getCoverImageUrl(edition)).toBe('https://hardcover.app/cover.jpg')
  })

  test('should fall back to Google imageUrl when Hardcover is null', () => {
    const edition: EditionWithProviders = {
      hardcoverBook: null,
      googleBook: { imageUrl: 'https://books.google.com/cover.jpg' },
      ibdbBook: { imageUrl: 'https://ibdb.com/cover.jpg' }
    }

    expect(getCoverImageUrl(edition)).toBe('https://books.google.com/cover.jpg')
  })

  test('should fall back to Google imageUrl when Hardcover imageUrl is null', () => {
    const edition: EditionWithProviders = {
      hardcoverBook: { imageUrl: null },
      googleBook: { imageUrl: 'https://books.google.com/cover.jpg' },
      ibdbBook: { imageUrl: 'https://ibdb.com/cover.jpg' }
    }

    expect(getCoverImageUrl(edition)).toBe('https://books.google.com/cover.jpg')
  })

  test('should fall back to IBDB imageUrl when Hardcover and Google are null', () => {
    const edition: EditionWithProviders = {
      hardcoverBook: null,
      googleBook: null,
      ibdbBook: { imageUrl: 'https://ibdb.com/cover.jpg' }
    }

    expect(getCoverImageUrl(edition)).toBe('https://ibdb.com/cover.jpg')
  })

  test('should fall back to IBDB imageUrl when Hardcover and Google imageUrls are null', () => {
    const edition: EditionWithProviders = {
      hardcoverBook: { imageUrl: null },
      googleBook: { imageUrl: null },
      ibdbBook: { imageUrl: 'https://ibdb.com/cover.jpg' }
    }

    expect(getCoverImageUrl(edition)).toBe('https://ibdb.com/cover.jpg')
  })

  test('should return undefined when no providers have imageUrl', () => {
    const edition: EditionWithProviders = {
      hardcoverBook: null,
      googleBook: null,
      ibdbBook: null
    }

    expect(getCoverImageUrl(edition)).toBeUndefined()
  })

  test('should return undefined when all provider imageUrls are null', () => {
    const edition: EditionWithProviders = {
      hardcoverBook: { imageUrl: null },
      googleBook: { imageUrl: null },
      ibdbBook: { imageUrl: null }
    }

    expect(getCoverImageUrl(edition)).toBeUndefined()
  })

  test('should handle partially present providers', () => {
    // Only googleBook present
    const edition1: EditionWithProviders = {
      googleBook: { imageUrl: 'https://books.google.com/cover.jpg' }
    }
    expect(getCoverImageUrl(edition1)).toBe('https://books.google.com/cover.jpg')

    // Only ibdbBook present
    const edition2: EditionWithProviders = {
      ibdbBook: { imageUrl: 'https://ibdb.com/cover.jpg' }
    }
    expect(getCoverImageUrl(edition2)).toBe('https://ibdb.com/cover.jpg')

    // Only hardcoverBook present
    const edition3: EditionWithProviders = {
      hardcoverBook: { imageUrl: 'https://hardcover.app/cover.jpg' }
    }
    expect(getCoverImageUrl(edition3)).toBe('https://hardcover.app/cover.jpg')
  })

  test('should handle empty edition object', () => {
    const edition: EditionWithProviders = {}

    expect(getCoverImageUrl(edition)).toBeUndefined()
  })

  describe('custom cover support', () => {
    test('should return custom cover URL when it is the only cover', () => {
      const edition: EditionWithProviders = {
        customCoverUrl: 'https://s3.example.com/covers/custom.jpg',
      }
      expect(getCoverImageUrl(edition)).toBe('https://s3.example.com/covers/custom.jpg')
    })

    test('should prefer custom cover over provider covers in fallback chain', () => {
      const edition: EditionWithProviders = {
        customCoverUrl: 'https://s3.example.com/covers/custom.jpg',
        hardcoverBook: { imageUrl: 'https://hardcover.app/cover.jpg' },
        googleBook: { imageUrl: 'https://books.google.com/cover.jpg' },
      }
      expect(getCoverImageUrl(edition)).toBe('https://s3.example.com/covers/custom.jpg')
    })

    test('should return custom cover when defaultCoverProvider is "custom"', () => {
      const edition: EditionWithProviders = {
        defaultCoverProvider: 'custom',
        customCoverUrl: 'https://s3.example.com/covers/custom.jpg',
        hardcoverBook: { imageUrl: 'https://hardcover.app/cover.jpg' },
      }
      expect(getCoverImageUrl(edition)).toBe('https://s3.example.com/covers/custom.jpg')
    })

    test('should fall back to providers when customCoverUrl is null', () => {
      const edition: EditionWithProviders = {
        customCoverUrl: null,
        hardcoverBook: { imageUrl: 'https://hardcover.app/cover.jpg' },
      }
      expect(getCoverImageUrl(edition)).toBe('https://hardcover.app/cover.jpg')
    })

    test('should respect user preferred provider over custom cover fallback', () => {
      const edition: EditionWithProviders = {
        customCoverUrl: 'https://s3.example.com/covers/custom.jpg',
        googleBook: { imageUrl: 'https://books.google.com/cover.jpg' },
      }
      expect(getCoverImageUrl(edition, 'google')).toBe('https://books.google.com/cover.jpg')
    })

    test('should fall back to custom cover when preferred provider has no image', () => {
      const edition: EditionWithProviders = {
        customCoverUrl: 'https://s3.example.com/covers/custom.jpg',
        googleBook: { imageUrl: null },
      }
      expect(getCoverImageUrl(edition, 'google')).toBe('https://s3.example.com/covers/custom.jpg')
    })

    test('should return custom cover when preferred provider is "custom"', () => {
      const edition: EditionWithProviders = {
        customCoverUrl: 'https://s3.example.com/covers/custom.jpg',
        hardcoverBook: { imageUrl: 'https://hardcover.app/cover.jpg' },
      }
      expect(getCoverImageUrl(edition, 'custom')).toBe('https://s3.example.com/covers/custom.jpg')
    })
  })
})
