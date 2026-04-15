import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { findOrCreateBook, findOrCreateEditionFromSignedResult } from '@/lib/db/books'
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
      signedResult: SignedBookSearchResult
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

    // Validate signed result is provided
    if (!signedResult) {
      return NextResponse.json(
        { error: 'Signed result is required' },
        { status: 400 }
      )
    }

    // Verify signature before processing
    if (!verifySignature(signedResult)) {
      return NextResponse.json(
        { error: 'Invalid signature - book data may have been tampered with' },
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

    // Extract book data from the verified signed result
    const bookData = signedResult

    // Find or create book (now with book type detection)
    const book = await findOrCreateBook(
      bookData.title,
      bookData.authors,
      'en', // Default to English, can be enhanced later
      bookData.categories // Pass categories for book type detection
    )

    // Find or create edition using the verified signed result data
    const edition = await findOrCreateEditionFromSignedResult(book.id, signedResult)

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

    // Create user book entry with new tracking fields
    const userBook = await prisma.userBook.create({
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
            ibdbBook: true
          }
        }
      }
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
            ibdbBook: true
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
