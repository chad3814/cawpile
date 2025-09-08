import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/audit/logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin()
    const { id } = await params
    const body = await request.json()
    const { isAdmin } = body

    if (typeof isAdmin !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Prevent super admin from removing their own admin privileges
    if (id === admin.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin privileges' },
        { status: 400 }
      )
    }

    // Get current user state for audit logging
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { isAdmin: true, email: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user admin status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isSuperAdmin: true
      }
    })

    // Log the action
    await logAdminAction(
      admin.id,
      {
        entityType: 'User',
        entityId: id,
        actionType: 'UPDATE',
        fieldName: 'isAdmin',
        oldValue: currentUser.isAdmin.toString(),
        newValue: isAdmin.toString()
      }
    )

    return NextResponse.json(updatedUser)
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}