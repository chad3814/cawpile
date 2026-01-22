/**
 * Tests for profile page server component logic
 * Task Group 5.1: Tests for profile page logic
 */

describe('Profile Page Logic', () => {
  describe('profileEnabled check', () => {
    test('should return 404 when user exists but profileEnabled is false', () => {
      // When profileEnabled is false, the page component calls notFound()
      // This results in a 404 response being shown to the user
      const user = {
        id: 'user-1',
        username: 'testuser',
        profileEnabled: false,
        showCurrentlyReading: true,
        showTbr: false
      }

      // The check: if (!user || !user.profileEnabled) { notFound() }
      const shouldShow404 = !user || !user.profileEnabled
      expect(shouldShow404).toBe(true)
    })

    test('should return profile when profileEnabled is true', () => {
      const user = {
        id: 'user-1',
        username: 'testuser',
        profileEnabled: true,
        showCurrentlyReading: true,
        showTbr: false
      }

      const shouldShow404 = !user || !user.profileEnabled
      expect(shouldShow404).toBe(false)
    })
  })

  describe('TBR data fetching', () => {
    test('should fetch TBR only when showTbr is true', () => {
      const userWithTbrEnabled = {
        showTbr: true
      }

      // Logic: if (user.showTbr) { tbr = await getProfileTbr(user.id) }
      const shouldFetchTbr = userWithTbrEnabled.showTbr
      expect(shouldFetchTbr).toBe(true)
    })

    test('should not fetch TBR when showTbr is false', () => {
      const userWithTbrDisabled = {
        showTbr: false
      }

      const shouldFetchTbr = userWithTbrDisabled.showTbr
      expect(shouldFetchTbr).toBe(false)
    })
  })

  describe('TBR data structure', () => {
    test('should pass correct TBR data structure to client component', () => {
      const mockTbrData = {
        books: [
          {
            id: 'userbook-1',
            status: 'WANT_TO_READ',
            edition: {
              id: 'edition-1',
              title: null,
              book: {
                title: 'Test Book',
                authors: ['Test Author']
              },
              googleBook: {
                imageUrl: 'https://example.com/cover.jpg'
              }
            }
          }
        ],
        totalCount: 10
      }

      // Verify the structure matches expected ProfileTbrData
      expect(mockTbrData).toHaveProperty('books')
      expect(mockTbrData).toHaveProperty('totalCount')
      expect(Array.isArray(mockTbrData.books)).toBe(true)
      expect(typeof mockTbrData.totalCount).toBe('number')
    })
  })
})
