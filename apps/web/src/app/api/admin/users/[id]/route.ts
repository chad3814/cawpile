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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdmin()
    const { id } = await params

    // Prevent self-deletion
    if (id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Fetch user data before deletion for validation and audit logging
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isSuperAdmin: true,
        _count: {
          select: {
            userBooks: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of admin users
    if (user.isAdmin || user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      )
    }

    // Delete the user - Prisma cascade handles cleanup of:
    // - UserBooks -> CawpileRatings, ReadingSessions, SharedReviews
    // - Sessions, Accounts
    // - UserBookClubs, UserReadathons
    // - SharedReviews
    await prisma.user.delete({
      where: { id }
    })

    // Log the deletion
    await logAdminAction(admin.id, {
      entityType: 'User',
      entityId: id,
      actionType: 'DELETE',
      oldValue: {
        email: user.email,
        name: user.name,
        booksCount: user._count.userBooks,
      },
    })

    return NextResponse.json({
      message: 'User deleted successfully'
    })
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
