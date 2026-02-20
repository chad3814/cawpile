/**
 * Tests for CSV builder functions.
 * Task Group 4.3: Additional integration tests for CSV export
 */

import {
  buildProfileCsv,
  buildBooksCsv,
  buildRatingsCsv,
  buildSessionsCsv,
  buildSharedReviewsCsv,
  buildBookClubsCsv,
  buildReadathonsCsv,
} from '@/lib/export/csvBuilder'
import type { RawUserExportData } from '@/lib/export/exportUtils'

describe('CSV Builder Functions', () => {
  const mockProfile: RawUserExportData['profile'] = {
    name: 'Test User',
    username: 'testuser',
    bio: 'A reader',
    readingGoal: 12,
    dashboardLayout: 'GRID',
    librarySortBy: 'END_DATE',
    librarySortOrder: 'DESC',
    profileEnabled: true,
    showCurrentlyReading: true,
    showTbr: false,
  }

  const mockUserBooks: RawUserExportData['userBooks'] = [
    {
      id: 'ub1',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-01-01'),
      finishDate: new Date('2024-01-15'),
      progress: 100,
      currentPage: 350,
      review: 'Great book!',
      notes: 'My notes',
      isFavorite: true,
      acquisitionMethod: 'Purchased',
      acquisitionOther: null,
      bookClubName: 'My Book Club',
      readathonName: null,
      isReread: false,
      dnfReason: null,
      lgbtqRepresentation: 'Yes',
      lgbtqDetails: 'MC is queer',
      disabilityRepresentation: null,
      disabilityDetails: null,
      isNewAuthor: true,
      authorPoc: null,
      authorPocDetails: null,
      preferredCoverProvider: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      edition: {
        id: 'ed1',
        isbn10: '1234567890',
        isbn13: '9781234567890',
        book: {
          title: 'Test Book',
          authors: ['Author One', 'Author Two'],
        },
      },
      cawpileRating: {
        characters: 8,
        atmosphere: 7,
        writing: 9,
        plot: 8,
        intrigue: 7,
        logic: 8,
        enjoyment: 9,
        average: 8.0,
      },
      readingSessions: [
        {
          id: 'rs1',
          startPage: 1,
          endPage: 100,
          pagesRead: 100,
          duration: 120,
          notes: 'First session',
          sessionDate: new Date('2024-01-05'),
        },
      ],
      sharedReview: {
        shareToken: 'abc123',
        showDates: true,
        showBookClubs: true,
        showReadathons: false,
        showReview: true,
      },
    },
  ]

  describe('buildProfileCsv', () => {
    test('generates valid profile CSV with header row and data row', () => {
      const csv = buildProfileCsv(mockProfile)
      const lines = csv.split('\n')

      expect(lines.length).toBe(2)
      expect(lines[0]).toContain('name')
      expect(lines[0]).toContain('username')
      expect(lines[1]).toContain('Test User')
      expect(lines[1]).toContain('testuser')
    })
  })

  describe('buildBooksCsv', () => {
    test('generates valid books CSV with denormalized book data', () => {
      const csv = buildBooksCsv(mockUserBooks)
      const lines = csv.split('\n')

      expect(lines.length).toBe(2)
      expect(lines[0]).toContain('bookTitle')
      expect(lines[0]).toContain('bookAuthors')
      expect(lines[1]).toContain('Test Book')
      expect(lines[1]).toContain('Author One;Author Two')
    })

    test('handles user with no books', () => {
      const csv = buildBooksCsv([])
      const lines = csv.split('\n')

      expect(lines.length).toBe(1) // Only header row
    })
  })

  describe('buildRatingsCsv', () => {
    test('extracts ratings from userBooks with userBookId', () => {
      const csv = buildRatingsCsv(mockUserBooks)
      const lines = csv.split('\n')

      expect(lines.length).toBe(2)
      expect(lines[0]).toContain('userBookId')
      expect(lines[0]).toContain('characters')
      expect(lines[1]).toContain('ub1')
      expect(lines[1]).toContain('8')
    })

    test('excludes books without ratings', () => {
      const booksWithoutRating = [
        { ...mockUserBooks[0], cawpileRating: null },
      ]
      const csv = buildRatingsCsv(booksWithoutRating)
      const lines = csv.split('\n')

      expect(lines.length).toBe(1) // Only header row
    })
  })

  describe('buildSessionsCsv', () => {
    test('extracts reading sessions with userBookId', () => {
      const csv = buildSessionsCsv(mockUserBooks)
      const lines = csv.split('\n')

      expect(lines.length).toBe(2)
      expect(lines[0]).toContain('userBookId')
      expect(lines[0]).toContain('pagesRead')
      expect(lines[1]).toContain('ub1')
      expect(lines[1]).toContain('100')
    })
  })

  describe('buildSharedReviewsCsv', () => {
    test('extracts shared reviews with userBookId', () => {
      const csv = buildSharedReviewsCsv(mockUserBooks)
      const lines = csv.split('\n')

      expect(lines.length).toBe(2)
      expect(lines[0]).toContain('shareToken')
      expect(lines[1]).toContain('abc123')
    })
  })

  describe('buildBookClubsCsv', () => {
    test('generates valid book clubs CSV', () => {
      const bookClubs = [
        { name: 'My Book Club', usageCount: 5, lastUsed: new Date('2024-01-15') },
      ]
      const csv = buildBookClubsCsv(bookClubs)
      const lines = csv.split('\n')

      expect(lines.length).toBe(2)
      expect(lines[0]).toContain('name')
      expect(lines[1]).toContain('My Book Club')
    })
  })

  describe('buildReadathonsCsv', () => {
    test('generates valid readathons CSV', () => {
      const readathons = [
        { name: 'Summer Readathon', usageCount: 2, lastUsed: new Date('2024-06-01') },
      ]
      const csv = buildReadathonsCsv(readathons)
      const lines = csv.split('\n')

      expect(lines.length).toBe(2)
      expect(lines[0]).toContain('name')
      expect(lines[1]).toContain('Summer Readathon')
    })
  })
})
