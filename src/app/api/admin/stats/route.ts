import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/admin'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const [totalBooks, totalUsers, totalEditions, fictionCount] = await Promise.all([
      prisma.book.count(),
      prisma.user.count(),
      prisma.edition.count(),
      prisma.book.count({
        where: { bookType: 'FICTION' }
      }),
    ])

    const stats = {
      totalBooks,
      totalUsers,
      totalEditions,
      booksByType: {
        fiction: fictionCount,
        nonFiction: totalBooks - fictionCount,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}