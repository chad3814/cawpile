import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { resizeAvatar } from '@/lib/image-processing'
import { deleteAvatar, extractKeyFromUrl } from '@/lib/s3-upload'

/**
 * POST /api/user/avatar
 * Completes the avatar upload process by triggering resize and updating user profile
 *
 * Request body: { key: string } - The S3 key of the uploaded image
 * Response: { profilePictureUrl: string }
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { key } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'S3 key is required' },
        { status: 400 }
      )
    }

    // Verify the key belongs to this user (security check)
    if (!key.startsWith(`avatars/${user.id}/`)) {
      return NextResponse.json(
        { error: 'Invalid S3 key' },
        { status: 403 }
      )
    }

    // Get current profile picture URL to delete old avatar if exists
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profilePictureUrl: true },
    })

    // Resize the uploaded image
    const resizedUrl = await resizeAvatar(key)

    // Update user profile with new picture URL
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { profilePictureUrl: resizedUrl },
      select: { profilePictureUrl: true },
    })

    // Delete old avatar if it exists (async, don't wait)
    if (currentUser?.profilePictureUrl) {
      const oldKey = extractKeyFromUrl(currentUser.profilePictureUrl)
      if (oldKey) {
        deleteAvatar(oldKey).catch((err) => {
          console.error('Failed to delete old avatar:', err)
        })
      }
    }

    // Delete the original (non-resized) uploaded file (async, don't wait)
    deleteAvatar(key).catch((err) => {
      console.error('Failed to delete original upload:', err)
    })

    return NextResponse.json({
      profilePictureUrl: updatedUser.profilePictureUrl,
    })
  } catch (error) {
    console.error('Error completing avatar upload:', error)
    return NextResponse.json(
      { error: 'Failed to process avatar upload' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/avatar
 * Removes the user's custom avatar and clears the profilePictureUrl field
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

    // Get current profile picture URL
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { profilePictureUrl: true },
    })

    if (!currentUser?.profilePictureUrl) {
      return NextResponse.json({ success: true })
    }

    // Clear the profile picture URL in database
    await prisma.user.update({
      where: { id: user.id },
      data: { profilePictureUrl: null },
    })

    // Delete from S3 (async, don't wait)
    const key = extractKeyFromUrl(currentUser.profilePictureUrl)
    if (key) {
      deleteAvatar(key).catch((err) => {
        console.error('Failed to delete avatar from S3:', err)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting avatar:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
