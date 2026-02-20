import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
    const { userBookId, startPage, endPage, duration, notes } = body

    // Validate input
    if (!userBookId || startPage === undefined || endPage === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (startPage < 0 || endPage < startPage) {
      return NextResponse.json(
        { error: 'Invalid page numbers' },
        { status: 400 }
      )
    }

    // Verify user owns this book
    const userBook = await prisma.userBook.findFirst({
      where: {
        id: userBookId,
        userId: session.user.id
      },
      include: {
        edition: {
          include: {
            googleBook: true
          }
        }
      }
    })

    if (!userBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Calculate pages read
    const pagesRead = endPage - startPage + 1

    // Create reading session
    const readingSession = await prisma.readingSession.create({
      data: {
        userBookId,
        startPage,
        endPage,
        pagesRead,
        duration: duration || null,
        notes: notes || null
      }
    })

    // Update book progress if we have total pages
    const totalPages = userBook.edition.googleBook?.pageCount
    if (totalPages && totalPages > 0) {
      const newProgress = Math.min(100, Math.round((endPage / totalPages) * 100))
      
      await prisma.userBook.update({
        where: { id: userBookId },
        data: {
          currentPage: endPage,
          progress: newProgress,
          status: newProgress === 100 ? 'COMPLETED' : 'READING',
          finishDate: newProgress === 100 && !userBook.finishDate ? new Date() : undefined
        }
      })
    } else {
      // Just update current page
      await prisma.userBook.update({
        where: { id: userBookId },
        data: {
          currentPage: endPage,
          status: userBook.status === 'WANT_TO_READ' ? 'READING' : userBook.status
        }
      })
    }

    return NextResponse.json({ readingSession })
  } catch (error) {
    console.error('Error creating reading session:', error)
    return NextResponse.json(
      { error: 'Failed to create reading session' },
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
    const userBookId = searchParams.get('userBookId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userBookId) {
      return NextResponse.json(
        { error: 'userBookId is required' },
        { status: 400 }
      )
    }

    // Verify user owns this book
    const userBook = await prisma.userBook.findFirst({
      where: {
        id: userBookId,
        userId: session.user.id
      }
    })

    if (!userBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Get reading sessions
    const [sessions, total] = await Promise.all([
      prisma.readingSession.findMany({
        where: { userBookId },
        orderBy: { sessionDate: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.readingSession.count({
        where: { userBookId }
      })
    ])

    // Calculate stats
    const stats = await prisma.readingSession.aggregate({
      where: { userBookId },
      _sum: { pagesRead: true, duration: true },
      _count: { id: true }
    })

    return NextResponse.json({
      sessions,
      total,
      stats: {
        totalSessions: stats._count.id,
        totalPagesRead: stats._sum.pagesRead || 0,
        totalMinutes: stats._sum.duration || 0
      }
    })
  } catch (error) {
    console.error('Error fetching reading sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading sessions' },
      { status: 500 }
    )
  }
}