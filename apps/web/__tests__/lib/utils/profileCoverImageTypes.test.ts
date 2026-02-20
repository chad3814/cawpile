/**
 * Tests for profile type compatibility with getCoverImageUrl utility
 * Task Group 1: Profile Type Definitions
 */
import { getCoverImageUrl, EditionWithProviders } from '@/lib/utils/getCoverImageUrl'
import { ProfileBookData, ProfileSharedReview } from '@/types/profile'

describe('Profile Cover Image Type Compatibility', () => {
  describe('ProfileBookData.edition type compatibility', () => {
    test('should work with getCoverImageUrl when all providers have images', () => {
      const edition: ProfileBookData['edition'] = {
        id: 'edition-1',
        title: 'Test Book',
        book: {
          title: 'Test Book',
          authors: ['Author One'],
          bookType: 'FICTION',
        },
        googleBook: {
          imageUrl: 'https://google.com/image.jpg',
          description: 'A great book',
          pageCount: 300,
        },
        hardcoverBook: {
          imageUrl: 'https://hardcover.app/image.jpg',
        },
        ibdbBook: {
          imageUrl: 'https://ibdb.dev/image.jpg',
        },
      }

      // Type should be compatible with getCoverImageUrl
      const imageUrl = getCoverImageUrl(edition as EditionWithProviders)
      expect(imageUrl).toBe('https://hardcover.app/image.jpg')
    })

    test('should work with getCoverImageUrl when only googleBook has image', () => {
      const edition: ProfileBookData['edition'] = {
        id: 'edition-2',
        title: 'Another Book',
        book: {
          title: 'Another Book',
          authors: ['Author Two'],
        },
        googleBook: {
          imageUrl: 'https://google.com/another.jpg',
          description: null,
          pageCount: null,
        },
        hardcoverBook: null,
        ibdbBook: null,
      }

      const imageUrl = getCoverImageUrl(edition as EditionWithProviders)
      expect(imageUrl).toBe('https://google.com/another.jpg')
    })

    test('should work with getCoverImageUrl when no providers have images', () => {
      const edition: ProfileBookData['edition'] = {
        id: 'edition-3',
        title: 'No Cover Book',
        book: {
          title: 'No Cover Book',
          authors: ['Author Three'],
        },
        googleBook: null,
        hardcoverBook: null,
        ibdbBook: null,
      }

      const imageUrl = getCoverImageUrl(edition as EditionWithProviders)
      expect(imageUrl).toBeUndefined()
    })
  })

  describe('ProfileBookData preferredCoverProvider field', () => {
    test('should respect preferredCoverProvider when set to google', () => {
      const edition: ProfileBookData['edition'] = {
        id: 'edition-4',
        title: 'Preferred Test',
        book: {
          title: 'Preferred Test',
          authors: ['Author'],
        },
        googleBook: {
          imageUrl: 'https://google.com/preferred.jpg',
          description: null,
          pageCount: null,
        },
        hardcoverBook: {
          imageUrl: 'https://hardcover.app/image.jpg',
        },
        ibdbBook: null,
      }

      const profileBook: ProfileBookData = {
        id: 'userbook-1',
        status: 'READING',
        format: ['PAPERBACK'],
        progress: 50,
        startDate: new Date(),
        finishDate: null,
        createdAt: new Date(),
        currentPage: 150,
        edition,
        preferredCoverProvider: 'google',
      }

      // When preferredCoverProvider is google, should use google image even though hardcover exists
      const imageUrl = getCoverImageUrl(edition as EditionWithProviders, profileBook.preferredCoverProvider)
      expect(imageUrl).toBe('https://google.com/preferred.jpg')
    })
  })

  describe('ProfileSharedReview.userBook.edition type compatibility', () => {
    test('should work with getCoverImageUrl for shared reviews', () => {
      const sharedReview: ProfileSharedReview = {
        id: 'shared-1',
        shareToken: 'abc123',
        showDates: true,
        showBookClubs: true,
        showReadathons: false,
        showReview: true,
        createdAt: new Date(),
        userBook: {
          id: 'userbook-1',
          startDate: new Date(),
          finishDate: new Date(),
          bookClubName: 'Test Club',
          readathonName: null,
          review: 'Great book!',
          preferredCoverProvider: 'hardcover',
          edition: {
            id: 'edition-5',
            title: 'Shared Book',
            book: {
              title: 'Shared Book',
              authors: ['Shared Author'],
              bookType: 'NONFICTION',
            },
            googleBook: {
              imageUrl: 'https://google.com/shared.jpg',
            },
            hardcoverBook: {
              imageUrl: 'https://hardcover.app/shared.jpg',
            },
            ibdbBook: {
              imageUrl: 'https://ibdb.dev/shared.jpg',
            },
          },
          cawpileRating: {
            id: 'rating-1',
            average: 8.5,
          },
        },
      }

      const imageUrl = getCoverImageUrl(
        sharedReview.userBook.edition as EditionWithProviders,
        sharedReview.userBook.preferredCoverProvider
      )
      expect(imageUrl).toBe('https://hardcover.app/shared.jpg')
    })
  })
})
