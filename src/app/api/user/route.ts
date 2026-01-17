import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { deleteAvatar, extractKeyFromUrl } from '@/lib/s3-upload'

/**
 * DELETE /api/user
 * Permanently deletes the user's account and all associated data
 * Cascading deletes are configured in the Prisma schema for:
 * - Account, Session, UserBook, UserBookClub, UserReadathon, SharedReview
 * - CawpileRating and ReadingSession cascade from UserBook
 *
 * Response: { success: true }
 */
export async function DELETE() {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user data for cleanup
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        profilePictureUrl: true,
        email: true,
      },
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete profile picture from S3 if exists
    if (userData.profilePictureUrl) {
      const key = extractKeyFromUrl(userData.profilePictureUrl)
      if (key) {
        try {
          await deleteAvatar(key)
        } catch (err) {
          console.error('Failed to delete avatar from S3:', err)
          // Continue with deletion even if S3 cleanup fails
        }
      }
    }

    // Delete the user - cascading deletes will handle related data
    // This includes: Account, Session, UserBook, UserBookClub, UserReadathon, SharedReview
    // UserBook cascade also deletes: CawpileRating, ReadingSession
    await prisma.user.delete({
      where: { id: user.id },
    })

    console.log(`User account deleted: ${userData.email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user account:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
