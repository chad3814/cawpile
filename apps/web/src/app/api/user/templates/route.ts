import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * GET /api/user/templates - Browse published video templates
 *
 * Requires authenticated user (no admin check)
 * Returns only published templates (isPublished = true)
 * Supports pagination via limit (default 12) and offset (default 0) query parameters
 * Supports sorting via sort query parameter: newest (default), name, popular
 * Supports search via search query parameter (case-insensitive name filter)
 * Includes creator info (name, image) and user's selectedTemplateId
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const sort = searchParams.get('sort') || 'newest'
    const search = searchParams.get('search')

    // Build where clause: only published templates
    const where: {
      isPublished: boolean
      name?: { contains: string; mode: 'insensitive' }
    } = {
      isPublished: true,
    }

    // Add search filter if provided
    if (search && search.trim() !== '') {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      }
    }

    // Determine sort order
    let orderBy: { createdAt?: 'desc' | 'asc'; name?: 'asc' | 'desc'; usageCount?: 'desc' | 'asc' }
    switch (sort) {
      case 'name':
        orderBy = { name: 'asc' }
        break
      case 'popular':
        orderBy = { usageCount: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Fetch templates and total count in parallel
    const [templates, totalCount] = await Promise.all([
      prisma.videoTemplate.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          creator: {
            select: { name: true, image: true },
          },
        },
      }),
      prisma.videoTemplate.count({ where }),
    ])

    // Fetch user's selectedTemplateId
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { selectedTemplateId: true },
    })

    return NextResponse.json({
      templates,
      totalCount,
      selectedTemplateId: userData?.selectedTemplateId ?? null,
    })
  } catch (error) {
    console.error('Error fetching user templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
