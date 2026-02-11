import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/audit/logger'
import { validateTemplateConfig } from '@/lib/video/validateTemplateConfig'

/**
 * GET /api/templates - List all video templates
 *
 * Requires admin authentication
 * Returns all templates ordered by createdAt descending (newest first)
 * Supports pagination via limit and offset query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const templates = await prisma.videoTemplate.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit, 10) : undefined,
      skip: offset ? parseInt(offset, 10) : undefined,
    })

    return NextResponse.json(
      { templates },
      {
        headers: {
          'Cache-Control': 'public, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates - Create a new video template
 *
 * Requires admin authentication
 * Accepts: name (required), description (optional), previewThumbnailUrl (optional), config (required)
 * Validates config against the template schema before saving
 * Returns 400 with validation errors if config is invalid
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, previewThumbnailUrl, config } = body as {
      name?: string
      description?: string
      previewThumbnailUrl?: string
      config?: unknown
    }

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (config === undefined) {
      return NextResponse.json(
        { error: 'Config is required' },
        { status: 400 }
      )
    }

    // Validate the config against the template schema
    const validationResult = validateTemplateConfig(config)
    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: 'Invalid template configuration',
          validationErrors: validationResult.errors,
        },
        { status: 400 }
      )
    }

    // Create the template
    const template = await prisma.videoTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        previewThumbnailUrl: previewThumbnailUrl?.trim() || null,
        config: config as object,
      },
    })

    await logAdminAction(user.id, {
      entityType: 'VideoTemplate',
      entityId: template.id,
      actionType: 'CREATE',
      newValue: { name: template.name },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
