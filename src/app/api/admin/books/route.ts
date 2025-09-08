import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/admin'
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search') || ''
    const searchField = searchParams.get('searchField') || 'title'
    const bookType = searchParams.get('bookType') || ''
    const language = searchParams.get('language') || ''
    const sortBy = searchParams.get('sortBy') || 'title'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Validate limit
    if (![10, 25, 50, 100].includes(limit)) {
      return NextResponse.json(
        { error: 'Invalid limit' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: Prisma.BookWhereInput = {}

    // Search
    if (search) {
      if (searchField === 'title') {
        where.title = {
          contains: search,
          mode: 'insensitive'
        }
      } else if (searchField === 'author') {
        where.authors = {
          has: search
        }
      } else if (searchField === 'isbn') {
        where.editions = {
          some: {
            OR: [
              { isbn10: { contains: search, mode: 'insensitive' } },
              { isbn13: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      }
    }

    // Filters
    if (bookType) {
      where.bookType = bookType as 'FICTION' | 'NONFICTION'
    }
    if (language) {
      where.language = language
    }

    // Get total count
    const totalCount = await prisma.book.count({ where })

    // Get books with pagination
    const books = await prisma.book.findMany({
      where,
      include: {
        editions: {
          select: {
            id: true,
            isbn10: true,
            isbn13: true,
            _count: {
              select: {
                userBooks: true
              }
            }
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Transform books to include user count
    const booksWithCounts = books.map(book => ({
      ...book,
      userCount: book.editions.reduce((acc, edition) => acc + edition._count.userBooks, 0)
    }))

    return NextResponse.json({
      books: booksWithCounts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching admin books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}