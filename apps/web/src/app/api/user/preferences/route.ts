import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { dashboardLayout, librarySortBy, librarySortOrder } = body

    // Validate the layout value
    if (dashboardLayout && !['GRID', 'TABLE'].includes(dashboardLayout)) {
      return NextResponse.json(
        { error: 'Invalid dashboard layout value' },
        { status: 400 }
      )
    }

    // Validate sort preferences
    if (librarySortBy && !['END_DATE', 'START_DATE', 'TITLE', 'DATE_ADDED'].includes(librarySortBy)) {
      return NextResponse.json(
        { error: 'Invalid library sort by value' },
        { status: 400 }
      )
    }

    if (librarySortOrder && !['ASC', 'DESC'].includes(librarySortOrder)) {
      return NextResponse.json(
        { error: 'Invalid library sort order value' },
        { status: 400 }
      )
    }

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dashboardLayout && { dashboardLayout }),
        ...(librarySortBy && { librarySortBy }),
        ...(librarySortOrder && { librarySortOrder }),
      },
      select: {
        dashboardLayout: true,
        librarySortBy: true,
        librarySortOrder: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}