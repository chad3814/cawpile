/**
 * Tests for export utility functions.
 * Task Group 1.1: Tests for export utilities
 */

import {
  formatExportDate,
  buildJsonExport,
  escapeCsvValue,
  convertToCsv,
  generateExportFilename,
  type RawUserExportData,
} from '@/lib/export/exportUtils'

describe('formatExportDate', () => {
  test('returns correct YYYY-MM-DD format', () => {
    const date = new Date('2024-03-15T10:30:00Z')
    const result = formatExportDate(date)
    expect(result).toBe('2024-03-15')
  })

  test('pads single digit months and days', () => {
    const date = new Date('2024-01-05T10:30:00Z')
    const result = formatExportDate(date)
    expect(result).toBe('2024-01-05')
  })
})

describe('generateExportFilename', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-06-20T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('returns json filename with correct date', () => {
    const result = generateExportFilename('json')
    expect(result).toBe('cawpile-export-2024-06-20.json')
  })

  test('returns zip filename for csv format', () => {
    const result = generateExportFilename('csv')
    expect(result).toBe('cawpile-export-2024-06-20.zip')
  })
})

describe('buildJsonExport', () => {
  const mockData: RawUserExportData = {
    profile: {
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
    },
    userBooks: [
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
    ],
    bookClubs: [
      {
        name: 'My Book Club',
        usageCount: 5,
        lastUsed: new Date('2024-01-15'),
      },
    ],
    readathons: [],
  }

  test('creates proper hierarchical structure with all required fields', () => {
    const result = buildJsonExport(mockData)

    expect(result.exportVersion).toBe('1.0')
    expect(result.exportedAt).toBeDefined()
    expect(result.profile).toBeDefined()
    expect(result.userBooks).toHaveLength(1)
    expect(result.bookClubs).toHaveLength(1)
    expect(result.readathons).toHaveLength(0)
  })

  test('includes inline book metadata in userBooks', () => {
    const result = buildJsonExport(mockData)
    const book = result.userBooks[0]

    expect(book.bookTitle).toBe('Test Book')
    expect(book.bookAuthors).toEqual(['Author One', 'Author Two'])
    expect(book.isbn10).toBe('1234567890')
    expect(book.isbn13).toBe('9781234567890')
    expect(book.editionId).toBe('ed1')
  })

  test('includes nested cawpileRating data', () => {
    const result = buildJsonExport(mockData)
    const rating = result.userBooks[0].cawpileRating

    expect(rating).not.toBeNull()
    expect(rating?.characters).toBe(8)
    expect(rating?.average).toBe(8.0)
  })

  test('includes nested readingSessions and sharedReview', () => {
    const result = buildJsonExport(mockData)
    const userBook = result.userBooks[0]

    expect(userBook.readingSessions).toHaveLength(1)
    expect(userBook.readingSessions[0].pagesRead).toBe(100)
    expect(userBook.sharedReview).not.toBeNull()
    expect(userBook.sharedReview?.shareToken).toBe('abc123')
  })
})

describe('escapeCsvValue', () => {
  test('returns empty string for null/undefined', () => {
    expect(escapeCsvValue(null)).toBe('')
    expect(escapeCsvValue(undefined)).toBe('')
  })

  test('returns plain value when no special characters', () => {
    expect(escapeCsvValue('simple text')).toBe('simple text')
  })

  test('wraps in quotes and escapes when contains comma', () => {
    expect(escapeCsvValue('one, two, three')).toBe('"one, two, three"')
  })

  test('wraps in quotes and escapes when contains newline', () => {
    expect(escapeCsvValue('line1\nline2')).toBe('"line1\nline2"')
  })

  test('doubles quote characters and wraps in quotes', () => {
    expect(escapeCsvValue('He said "hello"')).toBe('"He said ""hello"""')
  })

  test('handles multiple special characters together', () => {
    expect(escapeCsvValue('test, "quote"\nnewline')).toBe('"test, ""quote""\nnewline"')
  })
})

describe('convertToCsv', () => {
  test('generates correct header row', () => {
    const rows = [{ name: 'Alice', age: '30' }]
    const headers: (keyof typeof rows[0])[] = ['name', 'age']
    const result = convertToCsv(rows, headers)
    const lines = result.split('\n')

    expect(lines[0]).toBe('name,age')
  })

  test('generates correct data rows', () => {
    const rows = [
      { name: 'Alice', city: 'NYC' },
      { name: 'Bob', city: 'LA' },
    ]
    const headers: (keyof typeof rows[0])[] = ['name', 'city']
    const result = convertToCsv(rows, headers)
    const lines = result.split('\n')

    expect(lines[1]).toBe('Alice,NYC')
    expect(lines[2]).toBe('Bob,LA')
  })

  test('properly escapes values with special characters', () => {
    const rows = [{ description: 'A "quoted" value, with comma' }]
    const headers: (keyof typeof rows[0])[] = ['description']
    const result = convertToCsv(rows, headers)
    const lines = result.split('\n')

    expect(lines[1]).toBe('"A ""quoted"" value, with comma"')
  })
})
