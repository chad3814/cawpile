import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params

    const userBook = await prisma.userBook.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: { id: true, isPinned: true },
    })

    if (!userBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.userBook.update({
      where: { id },
      data: { isPinned: !userBook.isPinned },
      select: { id: true, isPinned: true },
    })

    return NextResponse.json({ userBook: updated })
  } catch (error) {
    console.error('Error toggling pin:', error)
    return NextResponse.json(
      { error: 'Failed to toggle pin' },
      { status: 500 }
    )
  }
}
