import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/admin'

export async function GET() {
  try {
    await requireAdmin()

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