import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
    const { id } = await params

    // Fetch user with counts for deletion summary
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        _count: {
          select: {
            userBooks: true,
            sharedReviews: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      booksCount: user._count.userBooks,
      sharedReviewsCount: user._count.sharedReviews,
    })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
