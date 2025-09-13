import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    const bookClubs = await prisma.userBookClub.findMany({
      where: {
        userId: user.id,
        ...(query && {
          name: {
            contains: query,
            mode: 'insensitive'
          }
        })
      },
      orderBy: [
        { usageCount: 'desc' },
        { lastUsed: 'desc' }
      ],
      take: 10,
      select: {
        id: true,
        name: true,
        usageCount: true,
        lastUsed: true
      }
    })

    return NextResponse.json({ bookClubs })
  } catch (error) {
    console.error('Error fetching book clubs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch book clubs' },
      { status: 500 }
    )
  }
}