import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { bookIds } = body as { bookIds: string[] }

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json(
        { error: 'bookIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Verify all books belong to this user
    const userBooks = await prisma.userBook.findMany({
      where: {
        id: { in: bookIds },
        userId: user.id,
      },
      select: { id: true },
    })

    if (userBooks.length !== bookIds.length) {
      return NextResponse.json(
        { error: 'One or more books not found' },
        { status: 404 }
      )
    }

    // Batch update sortOrder based on array position
    await prisma.$transaction(
      bookIds.map((id, index) =>
        prisma.userBook.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering books:', error)
    return NextResponse.json(
      { error: 'Failed to reorder books' },
      { status: 500 }
    )
  }
}
