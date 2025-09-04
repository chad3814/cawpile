import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { progress } = body

    // Validate progress
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Invalid progress value' },
        { status: 400 }
      )
    }

    // Check if user owns this book
    const userBook = await prisma.userBook.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!userBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Update progress
    const updatedBook = await prisma.userBook.update({
      where: {
        id: id
      },
      data: {
        progress,
        // If progress reaches 100%, mark as completed
        status: progress === 100 ? 'COMPLETED' : userBook.status,
        finishDate: progress === 100 && !userBook.finishDate ? new Date() : userBook.finishDate
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

    return NextResponse.json({ userBook: updatedBook })
  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}