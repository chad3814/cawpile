import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { validateTemplateConfig } from '@/lib/video/validateTemplateConfig'

/**
 * POST /api/user/templates/[id]/duplicate - Create a personal copy of a template
 *
 * Requires authenticated user (no admin check)
 * Deep copies the source template's config JSON
 * Validates the copied config with validateTemplateConfig as a safeguard
 * Creates a new VideoTemplate record with userId = current user, isPublished = false
 * Returns 404 if source template does not exist or is not published
 * Returns the newly created template record (status 201)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify source template exists and is published
    const sourceTemplate = await prisma.videoTemplate.findFirst({
      where: {
        id,
        isPublished: true,
      },
    })

    if (!sourceTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Deep copy the config JSON
    const copiedConfig = JSON.parse(JSON.stringify(sourceTemplate.config))

    // Validate the copied config as a safeguard
    const validationResult = validateTemplateConfig(copiedConfig)
    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: 'Template config validation failed after copy',
          validationErrors: validationResult.errors,
        },
        { status: 500 }
      )
    }

    // Create the duplicate template
    const template = await prisma.videoTemplate.create({
      data: {
        name: `Copy of ${sourceTemplate.name}`,
        description: sourceTemplate.description,
        previewThumbnailUrl: sourceTemplate.previewThumbnailUrl,
        config: copiedConfig as object,
        userId: user.id,
        isPublished: false,
        usageCount: 0,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error duplicating template:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate template' },
      { status: 500 }
    )
  }
}
