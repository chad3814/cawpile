import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'

// Simple in-memory cache
interface DataQualityCache {
  data: {
    totalBooks: number
    qualityScore: number
    issues: Array<{
      type: string
      label: string
      count: number
      severity: 'error' | 'warning' | 'info'
      link: string
    }>
  }
  timestamp: number
}

let cache: DataQualityCache | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  try {
    await requireAdmin()

    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data)
    }

    // Calculate data quality metrics
    const [
      totalBooks,
      booksWithoutGoogleData,
      booksWithoutDescription,
      booksWithoutEdition,
      duplicateISBNs,
      booksWithIncompleteRatings
    ] = await Promise.all([
      prisma.book.count(),
      
      // Books without Google Books data
      prisma.edition.count({
        where: {
          googleBook: null
        }
      }),
      
      // Books with Google data but no description
      prisma.googleBook.count({
        where: {
          OR: [
            { description: null },
            { description: '' }
          ]
        }
      }),
      
      prisma.book.count({
        where: {
          editions: {
            none: {}
          }
        }
      }),
      
      // Find duplicate ISBNs
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM (
          SELECT isbn13
          FROM "Edition"
          WHERE isbn13 IS NOT NULL AND isbn13 != ''
          GROUP BY isbn13
          HAVING COUNT(*) > 1
        ) as duplicates
      `,
      
      // Books with incomplete CAWPILE ratings (any rating is null)
      prisma.cawpileRating.count({
        where: {
          OR: [
            { characters: null },
            { atmosphere: null },
            { writing: null },
            { plot: null },
            { intrigue: null },
            { logic: null },
            { enjoyment: null }
          ]
        }
      })
    ])

    const duplicateCount = Number(duplicateISBNs[0]?.count || 0)

    const metrics = {
      totalBooks,
      qualityScore: Math.round(
        ((totalBooks - booksWithoutGoogleData - booksWithoutDescription - booksWithoutEdition - duplicateCount) / totalBooks) * 100
      ),
      issues: [
        {
          type: 'missing_google_data',
          label: 'Editions without Google Books data',
          count: booksWithoutGoogleData,
          severity: 'warning' as const,
          link: '/admin/books?filter=no_google_data'
        },
        {
          type: 'missing_description',
          label: 'Books without description',
          count: booksWithoutDescription,
          severity: 'warning' as const,
          link: '/admin/books?filter=no_description'
        },
        {
          type: 'missing_edition',
          label: 'Books without edition',
          count: booksWithoutEdition,
          severity: 'info' as const,
          link: '/admin/books?filter=no_edition'
        },
        {
          type: 'duplicate_isbn',
          label: 'Duplicate ISBNs',
          count: duplicateCount,
          severity: 'error' as const,
          link: '/admin/books?filter=duplicate_isbn'
        },
        {
          type: 'incomplete_ratings',
          label: 'Incomplete CAWPILE ratings',
          count: booksWithIncompleteRatings,
          severity: 'info' as const,
          link: '/admin/books?filter=incomplete_ratings'
        }
      ]
    }

    // Update cache
    cache = {
      data: metrics,
      timestamp: Date.now()
    }

    return NextResponse.json(metrics)
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error calculating data quality metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}