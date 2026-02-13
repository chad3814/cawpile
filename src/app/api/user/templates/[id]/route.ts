import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * GET /api/user/templates/[id] - Get a single published template's details
 *
 * Requires authenticated user (no admin check)
 * Returns 404 if template does not exist or is not published (do not distinguish)
 * Includes creator info (name, image) and full config JSON
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const template = await prisma.videoTemplate.findFirst({
      where: {
        id,
        isPublished: true,
      },
      include: {
        creator: {
          select: { name: true, image: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}
