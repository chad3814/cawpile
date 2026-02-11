import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/admin'
import { logAdminAction, logFieldChanges } from '@/lib/audit/logger'
import { validateTemplateConfig } from '@/lib/video/validateTemplateConfig'

/**
 * GET /api/templates/[id] - Get a single video template
 *
 * Requires admin authentication
 * Returns 404 if template not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const template = await prisma.videoTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { template },
      {
        headers: {
          'Cache-Control': 'public, max-age=60',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/templates/[id] - Update a video template
 *
 * Requires admin authentication
 * Accepts partial updates for any field: name, description, previewThumbnailUrl, config
 * If config is provided, validates before saving
 * Returns 404 if template not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, previewThumbnailUrl, config } = body as {
      name?: string
      description?: string
      previewThumbnailUrl?: string
      config?: unknown
    }

    // Check if template exists
    const existingTemplate = await prisma.videoTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Validate config if provided
    if (config !== undefined) {
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
    }

    // Build update data (only include fields that are provided)
    const updateData: {
      name?: string
      description?: string | null
      previewThumbnailUrl?: string | null
      config?: object
    } = {}

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'Name must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (previewThumbnailUrl !== undefined) {
      updateData.previewThumbnailUrl = previewThumbnailUrl?.trim() || null
    }

    if (config !== undefined) {
      updateData.config = config as object
    }

    // Track changes for audit logging
    const changes: Record<string, { old: unknown; new: unknown }> = {}
    if (updateData.name !== undefined && updateData.name !== existingTemplate.name) {
      changes.name = { old: existingTemplate.name, new: updateData.name }
    }
    if (updateData.description !== undefined && updateData.description !== existingTemplate.description) {
      changes.description = { old: existingTemplate.description, new: updateData.description }
    }
    if (updateData.previewThumbnailUrl !== undefined && updateData.previewThumbnailUrl !== existingTemplate.previewThumbnailUrl) {
      changes.previewThumbnailUrl = { old: existingTemplate.previewThumbnailUrl, new: updateData.previewThumbnailUrl }
    }
    if (updateData.config !== undefined) {
      changes.config = { old: existingTemplate.config, new: updateData.config }
    }

    // Update the template
    const template = await prisma.videoTemplate.update({
      where: { id },
      data: updateData,
    })

    if (Object.keys(changes).length > 0) {
      await logFieldChanges(user.id, 'VideoTemplate', id, changes)
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/templates/[id] - Delete a video template
 *
 * Requires admin authentication
 * Returns 404 if template not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if template exists
    const existingTemplate = await prisma.videoTemplate.findUnique({
      where: { id },
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Delete the template
    await prisma.videoTemplate.delete({
      where: { id },
    })

    await logAdminAction(user.id, {
      entityType: 'VideoTemplate',
      entityId: id,
      actionType: 'DELETE',
      oldValue: { name: existingTemplate.name },
    })

    return NextResponse.json({
      success: true,
      message: `Template "${existingTemplate.name}" deleted successfully`,
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
