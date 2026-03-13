import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl'
import { cacheCoverUrls } from '@/lib/cover-cache'
import type {
  MonthlyRecapExport,
  MonthlyRecapPreview,
  RecapBook,
  RecapCurrentlyReading,
  RecapStats,
} from '@/lib/recap/types'
import { getMonthName } from '@/lib/recap/types'

/**
 * GET /api/recap/monthly
 *
 * Query parameters:
 * - month: 1-12 (required)
 * - year: YYYY (required)
 * - preview: 'true' to get just counts (optional)
 *
 * Returns full recap data or preview counts for a specific month
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')
    const isPreview = searchParams.get('preview') === 'true'

    // Validate required parameters
    if (!monthParam || !yearParam) {
      return NextResponse.json(
        { error: 'Missing required parameters: month and year' },
        { status: 400 }
      )
    }

    const month = parseInt(monthParam, 10)
    const year = parseInt(yearParam, 10)

    // Validate month range
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12' },
        { status: 400 }
      )
    }

    // Validate year range (reasonable bounds)
    if (year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Year must be between 2000 and 2100' },
        { status: 400 }
      )
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    // If preview mode, just return counts
    if (isPreview) {
      const counts = await prisma.userBook.groupBy({
        by: ['status'],
        where: {
          userId: user.id,
          finishDate: {
            gte: startDate,
            lt: endDate,
          },
          status: {
            in: ['COMPLETED', 'DNF'],
          },
        },
        _count: true,
      })

      const completedCount =
        counts.find((c) => c.status === 'COMPLETED')?._count || 0
      const dnfCount = counts.find((c) => c.status === 'DNF')?._count || 0

      const preview: MonthlyRecapPreview = {
        month,
        year,
        monthName: getMonthName(month),
        bookCount: completedCount + dnfCount,
        completedCount,
        dnfCount,
      }

      return NextResponse.json(preview)
    }

    // Full export mode - fetch all book data
    const userBooks = await prisma.userBook.findMany({
      where: {
        userId: user.id,
        finishDate: {
          gte: startDate,
          lt: endDate,
        },
        status: {
          in: ['COMPLETED', 'DNF'],
        },
      },
      include: {
        edition: {
          include: {
            book: true,
            googleBook: true,
            hardcoverBook: true,
            ibdbBook: true,
          },
        },
        cawpileRating: true,
      },
      orderBy: {
        finishDate: 'asc',
      },
    })

    // Fetch "coming soon" books: books finished in the next month + currently reading
    const nextMonthEnd = new Date(year, month + 1, 1)

    const [currentlyReadingBooks, nextMonthBooks] = await Promise.all([
      prisma.userBook.findMany({
        where: {
          userId: user.id,
          status: 'READING',
        },
        include: {
          edition: {
            include: {
              book: true,
              googleBook: true,
              hardcoverBook: true,
              ibdbBook: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      }),
      prisma.userBook.findMany({
        where: {
          userId: user.id,
          finishDate: {
            gte: endDate,
            lt: nextMonthEnd,
          },
          status: {
            in: ['COMPLETED', 'DNF'],
          },
        },
        include: {
          edition: {
            include: {
              book: true,
              googleBook: true,
              hardcoverBook: true,
              ibdbBook: true,
            },
          },
        },
        orderBy: {
          finishDate: 'asc',
        },
      }),
    ])

    // Collect all raw cover URLs and cache them to S3 in parallel
    const allRawCoverUrls = [
      ...userBooks.map((ub) =>
        getCoverImageUrl(ub.edition, ub.preferredCoverProvider)
      ),
      ...currentlyReadingBooks.map((ub) =>
        getCoverImageUrl(ub.edition, ub.preferredCoverProvider)
      ),
      ...nextMonthBooks.map((ub) =>
        getCoverImageUrl(ub.edition, ub.preferredCoverProvider)
      ),
    ]
    const cachedUrlMap = await cacheCoverUrls(allRawCoverUrls)

    // Helper to look up cached URL, falling back to original
    const getCachedUrl = (rawUrl: string | null | undefined): string | null => {
      if (!rawUrl) return null
      return cachedUrlMap.get(rawUrl) ?? rawUrl
    }

    // Transform to export format
    const books: RecapBook[] = userBooks.map((ub) => {
      const displayTitle = ub.edition.title || ub.edition.book.title
      const rawCoverUrl = getCoverImageUrl(ub.edition, ub.preferredCoverProvider)
      const coverUrl = getCachedUrl(rawCoverUrl)

      // Get page count from any available provider
      const pageCount =
        ub.edition.googleBook?.pageCount ||
        ub.edition.hardcoverBook?.pages ||
        ub.edition.ibdbBook?.pageCount ||
        null

      return {
        id: ub.id,
        title: displayTitle,
        authors: ub.edition.book.authors,
        coverUrl,
        status: ub.status as 'COMPLETED' | 'DNF',
        finishDate: ub.finishDate?.toISOString() || '',
        rating: ub.cawpileRating
          ? {
              average: ub.cawpileRating.average,
              characters: ub.cawpileRating.characters,
              atmosphere: ub.cawpileRating.atmosphere,
              writing: ub.cawpileRating.writing,
              plot: ub.cawpileRating.plot,
              intrigue: ub.cawpileRating.intrigue,
              logic: ub.cawpileRating.logic,
              enjoyment: ub.cawpileRating.enjoyment,
            }
          : null,
        pageCount,
      }
    })

    // Transform currently reading + next month's finished books into "coming soon"
    const comingSoonIds = new Set<string>()
    const comingSoon: RecapCurrentlyReading[] = []

    // Add currently reading books first
    for (const ub of currentlyReadingBooks) {
      comingSoonIds.add(ub.id)
      const displayTitle = ub.edition.title || ub.edition.book.title
      const rawCoverUrl = getCoverImageUrl(ub.edition, ub.preferredCoverProvider)
      const coverUrl = getCachedUrl(rawCoverUrl)
      comingSoon.push({
        id: ub.id,
        title: displayTitle,
        authors: ub.edition.book.authors,
        coverUrl,
        progress: ub.progress,
      })
    }

    // Add next month's finished books (skip duplicates)
    for (const ub of nextMonthBooks) {
      if (comingSoonIds.has(ub.id)) continue
      comingSoonIds.add(ub.id)
      const displayTitle = ub.edition.title || ub.edition.book.title
      const rawCoverUrl = getCoverImageUrl(ub.edition, ub.preferredCoverProvider)
      const coverUrl = getCachedUrl(rawCoverUrl)
      comingSoon.push({
        id: ub.id,
        title: displayTitle,
        authors: ub.edition.book.authors,
        coverUrl,
        progress: null,
      })
    }

    // Calculate stats
    const completedBooks = books.filter((b) => b.status === 'COMPLETED')
    const dnfBooks = books.filter((b) => b.status === 'DNF')

    // Calculate total pages (only from completed books)
    const totalPages = completedBooks.reduce(
      (sum, b) => sum + (b.pageCount || 0),
      0
    )

    // Calculate average rating from books with ratings
    const booksWithRatings = books.filter((b) => b.rating !== null)
    const averageRating =
      booksWithRatings.length > 0
        ? Number(
            (
              booksWithRatings.reduce((sum, b) => sum + b.rating!.average, 0) /
              booksWithRatings.length
            ).toFixed(1)
          )
        : null

    // Find top and lowest rated books
    let topRatedBook: RecapStats['topRatedBook'] = null
    let lowestRatedBook: RecapStats['lowestRatedBook'] = null

    if (booksWithRatings.length > 0) {
      const sortedByRating = [...booksWithRatings].sort(
        (a, b) => b.rating!.average - a.rating!.average
      )

      const top = sortedByRating[0]
      topRatedBook = {
        title: top.title,
        coverUrl: top.coverUrl,
        rating: top.rating!.average,
      }

      // Only set lowest if there's more than one book with rating
      if (sortedByRating.length > 1) {
        const lowest = sortedByRating[sortedByRating.length - 1]
        lowestRatedBook = {
          title: lowest.title,
          coverUrl: lowest.coverUrl,
          rating: lowest.rating!.average,
        }
      }
    }

    const stats: RecapStats = {
      totalBooks: books.length,
      completedCount: completedBooks.length,
      dnfCount: dnfBooks.length,
      totalPages,
      averageRating,
      topRatedBook,
      lowestRatedBook,
    }

    const recapExport: MonthlyRecapExport = {
      meta: {
        month,
        year,
        monthName: getMonthName(month),
        generatedAt: new Date().toISOString(),
      },
      books,
      comingSoon,
      stats,
    }

    return NextResponse.json(recapExport)
  } catch (error) {
    console.error('Error fetching monthly recap:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monthly recap data' },
      { status: 500 }
    )
  }
}
