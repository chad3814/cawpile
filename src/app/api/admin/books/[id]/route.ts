import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/admin'
import { logFieldChanges } from '@/lib/audit/logger'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        editions: {
          include: {
            googleBook: true,
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
  { params }: { params: { id: string } }
) {
  try {
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
    
    const updates: any = {}
    const changes: Record<string, { old: unknown; new: unknown }> = {}
    
    // Get current book data for audit logging
    const currentBook = await prisma.book.findUnique({
      where: { id: params.id }
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
        updates[field] = body[field]
        changes[field] = {
          old: currentBook[field as keyof typeof currentBook],
          new: body[field]
        }
      }
    }
    
    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      const updatedBook = await prisma.book.update({
        where: { id: params.id },
        data: updates,
        include: {
          editions: {
            include: {
              googleBook: true,
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
        params.id,
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