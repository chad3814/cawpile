/**
 * Tests for getProfileTbr database query function
 * Task Group 3.1: Tests for TBR database query
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    userBook: {
      findMany: jest.fn(),
      count: jest.fn()
    }
  }
}))

import prisma from '@/lib/prisma'
import { getProfileTbr } from '@/lib/db/getProfileTbr'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('getProfileTbr', () => {
  const mockUserId = 'user-123'

  const mockTbrBooks = [
    {
      id: 'userbook-1',
      status: 'WANT_TO_READ',
      format: ['PAPERBACK'],
      progress: 0,
      startDate: null,
      finishDate: null,
      createdAt: new Date('2024-01-15'),
      currentPage: 0,
      edition: {
        id: 'edition-1',
        title: null,
        book: {
          id: 'book-1',
          title: 'Book One',
          authors: ['Author One'],
          bookType: 'FICTION'
        },
        googleBook: {
          imageUrl: 'https://example.com/cover1.jpg',
          description: 'A great book',
          pageCount: 300
        }
      },
      cawpileRating: null
    },
    {
      id: 'userbook-2',
      status: 'WANT_TO_READ',
      format: ['EBOOK'],
      progress: 0,
      startDate: null,
      finishDate: null,
      createdAt: new Date('2024-01-10'),
      currentPage: 0,
      edition: {
        id: 'edition-2',
        title: 'Book Two Special Edition',
        book: {
          id: 'book-2',
          title: 'Book Two',
          authors: ['Author Two'],
          bookType: 'NONFICTION'
        },
        googleBook: null
      },
      cawpileRating: null
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return books with status WANT_TO_READ', async () => {
    ;(mockPrisma.userBook.findMany as jest.Mock).mockResolvedValue(mockTbrBooks)
    ;(mockPrisma.userBook.count as jest.Mock).mockResolvedValue(2)

    const result = await getProfileTbr(mockUserId)

    expect(mockPrisma.userBook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: mockUserId,
          status: 'WANT_TO_READ'
        }
      })
    )
    expect(result.books).toHaveLength(2)
    expect(result.books[0].id).toBe('userbook-1')
  })

  test('should order by createdAt descending (newest first)', async () => {
    ;(mockPrisma.userBook.findMany as jest.Mock).mockResolvedValue(mockTbrBooks)
    ;(mockPrisma.userBook.count as jest.Mock).mockResolvedValue(2)

    await getProfileTbr(mockUserId)

    expect(mockPrisma.userBook.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { isPinned: 'desc' },
          { sortOrder: { sort: 'asc', nulls: 'last' } },
          { createdAt: 'desc' },
        ]
      })
    )
  })

  test('should fetch all books without a limit', async () => {
    ;(mockPrisma.userBook.findMany as jest.Mock).mockResolvedValue(mockTbrBooks)
    ;(mockPrisma.userBook.count as jest.Mock).mockResolvedValue(10)

    await getProfileTbr(mockUserId)

    const call = (mockPrisma.userBook.findMany as jest.Mock).mock.calls[0][0]
    expect(call).not.toHaveProperty('take')
  })

  test('should return total count alongside limited results', async () => {
    ;(mockPrisma.userBook.findMany as jest.Mock).mockResolvedValue(mockTbrBooks.slice(0, 2))
    ;(mockPrisma.userBook.count as jest.Mock).mockResolvedValue(23)

    const result = await getProfileTbr(mockUserId)

    expect(mockPrisma.userBook.count).toHaveBeenCalledWith({
      where: {
        userId: mockUserId,
        status: 'WANT_TO_READ'
      }
    })
    expect(result.books).toHaveLength(2)
    expect(result.totalCount).toBe(23)
  })
})
