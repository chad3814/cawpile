import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/admin'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookIds, bookType } = body

    // Validate input
    if (!bookIds || !Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid book IDs' },
        { status: 400 }
      )
    }

    if (bookIds.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 books can be updated at once' },
        { status: 400 }
      )
    }

    if (!['FICTION', 'NONFICTION'].includes(bookType)) {
      return NextResponse.json(
        { error: 'Invalid book type' },
        { status: 400 }
      )
    }

    // Start transaction for atomic updates
    const result = await prisma.$transaction(async (tx) => {
      // Get current books for audit logging
      const currentBooks = await tx.book.findMany({
        where: { id: { in: bookIds } },
        select: { id: true, bookType: true }
      })

      // Update all books
      const updateResult = await tx.book.updateMany({
        where: { id: { in: bookIds } },
        data: { bookType }
      })

      // Create audit log entries for each book
      const auditEntries = currentBooks
        .filter(book => book.bookType !== bookType)
        .map(book => ({
          adminId: user.id,
          entityType: 'Book',
          entityId: book.id,
          fieldName: 'bookType',
          oldValue: book.bookType,
          newValue: bookType,
          actionType: 'UPDATE'
        }))

      if (auditEntries.length > 0) {
        await tx.adminAuditLog.createMany({
          data: auditEntries
        })
      }

      return {
        updated: updateResult.count,
        unchanged: currentBooks.length - auditEntries.length
      }
    })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error in bulk update:', error)
    return NextResponse.json(
      { error: 'Failed to update books' },
      { status: 500 }
    )
  }
}