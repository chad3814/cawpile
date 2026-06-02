import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/admin'
import { logFieldChanges, logAdminAction } from '@/lib/audit/logger'
import { invalidateGlobalBookStatsCache } from '@/lib/db/bookStats'
import { Prisma } from '@prisma/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        editions: {
          include: {
            googleBook: true,
            hardcoverBook: true,
            ibdbBook: true,
            amazonBook: true,
            _count: {
              select: {
                userBooks: true
              }
            }
          }
        }
      }
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Calculate total user count
    const userCount = book.editions.reduce(
      (acc, edition) => acc + edition._count.userBooks,
      0
    )

    return NextResponse.json({
      ...book,
      userCount
    })
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate editable fields only
    const editableFields = [
      'title',
      'authors',
      'bookType',
      'language'
    ]

    const updates: Prisma.BookUpdateInput = {}
    const changes: Record<string, { old: unknown; new: unknown }> = {}

    // Get current book data for audit logging
    const currentBook = await prisma.book.findUnique({
      where: { id }
    })

    if (!currentBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Process updates and track changes
    for (const field of editableFields) {
      if (field in body && body[field] !== currentBook[field as keyof typeof currentBook]) {
        (updates as Record<string, unknown>)[field] = body[field]
        changes[field] = {
          old: currentBook[field as keyof typeof currentBook],
          new: body[field]
        }
      }
    }

    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      const updatedBook = await prisma.book.update({
        where: { id },
        data: updates,
        include: {
          editions: {
            include: {
              googleBook: true,
              amazonBook: true,
              _count: {
                select: {
                  userBooks: true
                }
              }
            }
          }
        }
      })

      // Log the changes
      await logFieldChanges(
        user.id,
        'Book',
        id,
        changes
      )

      // Calculate total user count
      const userCount = updatedBook.editions.reduce(
        (acc, edition) => acc + edition._count.userBooks,
        0
      )

      return NextResponse.json({
        ...updatedBook,
        userCount
      })
    } else {
      // No changes to make
      return NextResponse.json({
        ...currentBook,
        userCount: 0
      })
    }
  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch book data before deletion for audit logging
    const book = await prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        authors: true,
        bookType: true,
        ratingCount: true,
        ratingSum: true,
      }
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Delete the book - Prisma cascade handles cleanup of:
    // - Editions -> UserBooks -> CawpileRatings, ReadingSessions, SharedReviews
    // - GoogleBook, HardcoverBook, IbdbBook
    // The book's stored ratingCount/ratingSum is exactly its contribution to the
    // global stats row (added by recomputeBookStats over time), so subtract it.
    await prisma.$transaction(async (tx) => {
      await tx.book.delete({ where: { id } })
      if (book.ratingCount !== 0 || book.ratingSum !== 0) {
        await tx.globalBookStats.update({
          where: { id: 'global' },
          data: {
            ratingsCount: { decrement: book.ratingCount },
            ratingsTotal: { decrement: book.ratingSum },
          },
        })
      }
    })

    invalidateGlobalBookStatsCache()

    // Log the deletion
    await logAdminAction(user.id, {
      entityType: 'Book',
      entityId: id,
      actionType: 'DELETE',
      oldValue: {
        title: book.title,
        authors: book.authors,
        bookType: book.bookType,
      },
    })

    return NextResponse.json({
      message: 'Book deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json(
      { error: 'Failed to delete book' },
      { status: 500 }
    )
  }
}
