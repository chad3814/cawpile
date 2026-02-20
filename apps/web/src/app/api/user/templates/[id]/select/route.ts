import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * POST /api/user/templates/[id]/select - Select a template for the user's recap
 *
 * Requires authenticated user (no admin check)
 * Sets the user's selectedTemplateId to the given template ID
 * Atomically increments the template's usageCount (unless already selected)
 * Returns 404 if template does not exist or is not published
 * Idempotent: re-selecting the same template does not increment usageCount
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

    // Verify template exists and is published
    const template = await prisma.videoTemplate.findFirst({
      where: {
        id,
        isPublished: true,
      },
      select: { id: true },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Check if user already has this template selected
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { selectedTemplateId: true },
    })

    const alreadySelected = currentUser?.selectedTemplateId === id

    if (alreadySelected) {
      // Already selected: return success without incrementing usageCount
      return NextResponse.json({
        success: true,
        selectedTemplateId: id,
      })
    }

    // Not already selected: update user's selectedTemplateId and increment usageCount
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { selectedTemplateId: id },
      }),
      prisma.videoTemplate.update({
        where: { id },
        data: {
          usageCount: { increment: 1 },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      selectedTemplateId: id,
    })
  } catch (error) {
    console.error('Error selecting template:', error)
    return NextResponse.json(
      { error: 'Failed to select template' },
      { status: 500 }
    )
  }
}
