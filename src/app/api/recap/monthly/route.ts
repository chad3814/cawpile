import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl'

/**
 * Convert a raw cover image URL to an absolute proxied URL.
 * This prevents the video-gen server from hitting Google Books directly
 * (which rate-limits EC2 IPs), routing requests through our image proxy instead.
 */
function proxyImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const baseUrl = process.env.NEXTAUTH_URL || ''
  return `${baseUrl}/api/proxy/image?url=${encodeURIComponent(url)}`
}
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

    // Fetch currently reading books
    const currentlyReadingBooks = await prisma.userBook.findMany({
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
    })

    // Transform to export format
    const books: RecapBook[] = userBooks.map((ub) => {
      const displayTitle = ub.edition.title || ub.edition.book.title
      const rawCoverUrl = getCoverImageUrl(ub.edition, ub.preferredCoverProvider)
      const coverUrl = proxyImageUrl(rawCoverUrl)

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

    // Transform currently reading
    const currentlyReading: RecapCurrentlyReading[] = currentlyReadingBooks.map(
      (ub) => {
        const displayTitle = ub.edition.title || ub.edition.book.title
        const rawCoverUrl = getCoverImageUrl(ub.edition, ub.preferredCoverProvider)
        const coverUrl = proxyImageUrl(rawCoverUrl)

        return {
          id: ub.id,
          title: displayTitle,
          authors: ub.edition.book.authors,
          coverUrl,
          progress: ub.progress,
        }
      }
    )

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
      currentlyReading,
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
