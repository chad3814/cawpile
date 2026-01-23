/**
 * @jest-environment node
 */

/**
 * Tests for export API endpoint.
 * Task Group 2.1: Tests for export API
 */

import { GET } from '@/app/api/user/export/route'
import { NextRequest } from 'next/server'
import type { RawUserExportData } from '@/lib/export/exportUtils'

// Mock getCurrentUser
jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}))

// Mock fetchUserExportData
jest.mock('@/lib/export/fetchUserExportData', () => ({
  fetchUserExportData: jest.fn(),
}))

// Mock JSZip
jest.mock('jszip', () => {
  return jest.fn().mockImplementation(() => ({
    file: jest.fn(),
    generateAsync: jest.fn().mockResolvedValue(Buffer.from('mock-zip-content')),
  }))
})

import { getCurrentUser } from '@/lib/auth-helpers'
import { fetchUserExportData } from '@/lib/export/fetchUserExportData'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockFetchUserExportData = fetchUserExportData as jest.MockedFunction<typeof fetchUserExportData>

describe('GET /api/user/export', () => {
  const mockUserData: RawUserExportData = {
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
            authors: ['Author One'],
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

  function createRequest(url: string): NextRequest {
    return new NextRequest(new URL(url, 'http://localhost:3000'))
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns 401 when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const request = createRequest('/api/user/export?format=json')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  test('returns 400 when format parameter is missing', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
      isAdmin: false,
      isSuperAdmin: false,
    })

    const request = createRequest('/api/user/export')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid format parameter')
  })

  test('returns 400 when format parameter is invalid', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
      isAdmin: false,
      isSuperAdmin: false,
    })

    const request = createRequest('/api/user/export?format=xml')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid format parameter')
  })

  test('returns JSON with correct Content-Type header for json format', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
      isAdmin: false,
      isSuperAdmin: false,
    })
    mockFetchUserExportData.mockResolvedValue(mockUserData)

    const request = createRequest('/api/user/export?format=json')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    expect(response.headers.get('Content-Disposition')).toContain('.json')

    const data = await response.json()
    expect(data.exportVersion).toBe('1.0')
    expect(data.exportedAt).toBeDefined()
    expect(data.profile).toBeDefined()
    expect(data.userBooks).toHaveLength(1)
  })

  test('returns ZIP with correct Content-Type header for csv format', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
      isAdmin: false,
      isSuperAdmin: false,
    })
    mockFetchUserExportData.mockResolvedValue(mockUserData)

    const request = createRequest('/api/user/export?format=csv')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/zip')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    expect(response.headers.get('Content-Disposition')).toContain('.zip')
  })

  test('returns 500 when export fails', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
      isAdmin: false,
      isSuperAdmin: false,
    })
    mockFetchUserExportData.mockRejectedValue(new Error('Database error'))

    const request = createRequest('/api/user/export?format=json')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Failed to export data')
  })
})
