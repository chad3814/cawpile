import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getBookById } from '@/lib/googleBooks'
import { findOrCreateBook, findOrCreateEdition } from '@/lib/db/books'
import prisma from '@/lib/prisma'
import { BookStatus, Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { googleBooksId, status, format, startDate, finishDate, progress } = body

    // Fetch book data from Google Books
    const bookData = await getBookById(googleBooksId)

    if (!bookData) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Find or create book
    const book = await findOrCreateBook(
      bookData.title,
      bookData.authors,
      'en' // Default to English, can be enhanced later
    )

    // Find or create edition
    const edition = await findOrCreateEdition(book.id, bookData)

    // Check if user already has this book
    const existingUserBook = await prisma.userBook.findUnique({
      where: {
        userId_editionId: {
          userId: session.user.id,
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

    // Create user book entry
    const userBook = await prisma.userBook.create({
      data: {
        userId: session.user.id,
        editionId: edition.id,
        status,
        format,
        startDate: startDate ? new Date(startDate) : null,
        finishDate: finishDate ? new Date(finishDate) : null,
        progress: progress || 0
      },
      include: {
        edition: {
          include: {
            book: true,
            googleBook: true
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
  const session = await auth()

  if (!session?.user?.id) {
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
      userId: session.user.id
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
            googleBook: true
          }
        }
      },
      orderBy: [
        {
          status: 'asc' // READING first, then WANT_TO_READ, then COMPLETED
        },
        {
          updatedAt: 'desc'
        }
      ],
      take: limit ? parseInt(limit, 10) : undefined,
      skip: offset ? parseInt(offset, 10) : undefined
    })

    // Get counts for each status
    const stats = await prisma.userBook.groupBy({
      by: ['status'],
      where: {
        userId: session.user.id
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
