import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { findOrCreateBook, findOrCreateEditionFromSignedResult } from '@/lib/db/books'
import { recomputeBookStats } from '@/lib/db/bookStats'
import prisma from '@/lib/prisma'
import { BookStatus, BookFormat, Prisma } from '@prisma/client'
import type { SignedBookSearchResult } from '@/lib/search/types'
import { verifySignature } from '@/lib/search/utils/signResult'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      signedResult,
      editionId,
      status,
      format,
      startDate,
      finishDate,
      progress,
      // New tracking fields
      acquisitionMethod,
      acquisitionOther,
      bookClubName,
      readathonName,
      isReread
    } = body as {
      signedResult?: SignedBookSearchResult
      editionId?: string
      status: BookStatus
      format: BookFormat[]
      startDate?: string
      finishDate?: string
      progress?: number
      acquisitionMethod?: string
      acquisitionOther?: string
      bookClubName?: string
      readathonName?: string
      isReread?: boolean
    }

    // Require exactly one source: an internal editionId (public page) or a
    // signed search result (search-driven add flow).
    if (!signedResult && !editionId) {
      return NextResponse.json(
        { error: 'Either editionId or signedResult is required' },
        { status: 400 }
      )
    }

    // Validate format array
    if (!format || !Array.isArray(format) || format.length === 0) {
      return NextResponse.json(
        { error: 'At least one format is required' },
        { status: 400 }
      )
    }

    // Validate each format is a valid BookFormat enum value
    const validFormats = Object.values(BookFormat)
    for (const f of format) {
      if (!validFormats.includes(f)) {
        return NextResponse.json(
          { error: `Invalid format: ${f}` },
          { status: 400 }
        )
      }
    }

    // Remove duplicates from format array
    const uniqueFormats = Array.from(new Set(format))

    // Resolve the edition: look up an existing one by id, or verify + create
    // from the signed search result.
    let edition: { id: string; bookId: string }

    if (editionId) {
      const existingEdition = await prisma.edition.findUnique({
        where: { id: editionId },
        select: { id: true, bookId: true },
      })
      if (!existingEdition) {
        return NextResponse.json(
          { error: 'Edition not found' },
          { status: 404 }
        )
      }
      edition = existingEdition
    } else {
      // signedResult is guaranteed present here by the check above.
      if (!verifySignature(signedResult!)) {
        return NextResponse.json(
          { error: 'Invalid signature - book data may have been tampered with' },
          { status: 400 }
        )
      }
      const book = await findOrCreateBook(
        signedResult!.title,
        signedResult!.authors,
        'en', // Default to English, can be enhanced later
        signedResult!.categories // Pass categories for book type detection
      )
      edition = await findOrCreateEditionFromSignedResult(book.id, signedResult!)
    }

    // Check if user already has this book
    const existingUserBook = await prisma.userBook.findUnique({
      where: {
        userId_editionId: {
          userId: user.id,
          editionId: edition.id
        }
      }
    })

    if (existingUserBook) {
      return NextResponse.json(
        { error: 'Book already in library' },
        { status: 400 }
      )
    }

    // Store book club/readathon names in autocomplete tables if provided
    if (bookClubName) {
      await prisma.userBookClub.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: bookClubName
          }
        },
        update: {
          lastUsed: new Date(),
          usageCount: { increment: 1 }
        },
        create: {
          userId: user.id,
          name: bookClubName
        }
      })
    }

    if (readathonName) {
      await prisma.userReadathon.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: readathonName
          }
        },
        update: {
          lastUsed: new Date(),
          usageCount: { increment: 1 }
        },
        create: {
          userId: user.id,
          name: readathonName
        }
      })
    }

    // Create user book entry with new tracking fields and recompute book stats
    // atomically so denormalized book/global stats stay consistent.
    const userBook = await prisma.$transaction(async (tx) => {
      const created = await tx.userBook.create({
        data: {
          userId: user.id,
          editionId: edition.id,
          status,
          format: uniqueFormats,
          startDate: startDate ? new Date(startDate) : null,
          finishDate: finishDate ? new Date(finishDate) : null,
          progress: progress || 0,
          // New tracking fields
          acquisitionMethod,
          acquisitionOther: acquisitionMethod === 'Other' ? acquisitionOther : null,
          bookClubName,
          readathonName,
          isReread: isReread || false
        },
        include: {
          edition: {
            include: {
              book: true,
              googleBook: true,
              hardcoverBook: true,
              ibdbBook: true,
              amazonBook: true
            }
          }
        }
      })

      await recomputeBookStats(edition.bookId, tx)

      return created
    })

    return NextResponse.json({ userBook })
  } catch (error) {
    console.error('Error adding book:', error)
    return NextResponse.json(
      { error: 'Failed to add book' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const where: Prisma.UserBookScalarWhereInput = {
      userId: user.id
    }

    if (status) {
      where.status = status as BookStatus
    }

    const userBooks = await prisma.userBook.findMany({
      where,
      include: {
        edition: {
          include: {
            book: true,
            googleBook: true,
            hardcoverBook: true,
            ibdbBook: true,
            amazonBook: true
          }
        },
        cawpileRating: true
      },
      orderBy: status
        ? [
            { isPinned: 'desc' },
            { sortOrder: { sort: 'asc', nulls: 'last' } },
            { updatedAt: 'desc' },
          ]
        : [
            { status: 'asc' },
            { isPinned: 'desc' },
            { sortOrder: { sort: 'asc', nulls: 'last' } },
            { updatedAt: 'desc' },
          ],
      take: limit ? parseInt(limit, 10) : undefined,
      skip: offset ? parseInt(offset, 10) : undefined
    })

    // Get counts for each status
    const stats = await prisma.userBook.groupBy({
      by: ['status'],
      where: {
        userId: user.id
      },
      _count: true
    })

    const formattedStats = {
      WANT_TO_READ: 0,
      READING: 0,
      COMPLETED: 0
    }

    stats.forEach(stat => {
      formattedStats[stat.status as keyof typeof formattedStats] = stat._count
    })

    return NextResponse.json({
      books: userBooks,
      stats: formattedStats,
      total: userBooks.length
    })
  } catch (error) {
    console.error('Error fetching user books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}
