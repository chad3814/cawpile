import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * GET /api/user/templates/mine - Fetch current user's personal (duplicated) templates
 *
 * Requires authenticated user (no admin check)
 * Returns only templates where userId = current user and isPublished = false
 * These are personal copies created via the duplicate action
 */
export async function GET(_request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.videoTemplate.findMany({
      where: {
        userId: user.id,
        isPublished: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { name: true, image: true },
        },
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching user personal templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personal templates' },
      { status: 500 }
    )
  }
}
