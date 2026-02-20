import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'

// Username validation regex: alphanumeric, hyphen, underscore only
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/

/**
 * GET /api/user/settings
 * Returns the current user's profile and preference settings
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        username: true,
        bio: true,
        profilePictureUrl: true,
        readingGoal: true,
        showCurrentlyReading: true,
        profileEnabled: true,
        showTbr: true,
        image: true, // Google OAuth image as fallback
        email: true,
      },
    })

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/settings
 * Updates the user's profile and preference settings
 * Accepts partial updates for: name, username, bio, readingGoal, showCurrentlyReading, profileEnabled, showTbr
 */
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
    const { name, username, bio, readingGoal, showCurrentlyReading, profileEnabled, showTbr } = body

    // Build update data object with only provided fields
    const updateData: {
      name?: string | null
      username?: string
      bio?: string | null
      readingGoal?: number
      showCurrentlyReading?: boolean
      profileEnabled?: boolean
      showTbr?: boolean
    } = {}

    // Validate and set name (optional, max 255 chars)
    if (name !== undefined) {
      if (name !== null && typeof name === 'string' && name.length > 255) {
        return NextResponse.json(
          { error: 'Name must be 255 characters or less', field: 'name' },
          { status: 400 }
        )
      }
      updateData.name = name || null
    }

    // Validate and set username (required format, max 128 chars, case-insensitive unique)
    if (username !== undefined) {
      if (typeof username !== 'string' || username.length === 0) {
        return NextResponse.json(
          { error: 'Username is required', field: 'username' },
          { status: 400 }
        )
      }

      if (username.length > 128) {
        return NextResponse.json(
          { error: 'Username must be 128 characters or less', field: 'username' },
          { status: 400 }
        )
      }

      if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, hyphens, and underscores', field: 'username' },
          { status: 400 }
        )
      }

      // Check for case-insensitive uniqueness (excluding current user)
      const existingUser = await prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: 'insensitive',
          },
          NOT: {
            id: user.id,
          },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken', field: 'username' },
          { status: 400 }
        )
      }

      updateData.username = username
    }

    // Validate and set bio (optional, max 500 chars)
    if (bio !== undefined) {
      if (bio !== null && typeof bio === 'string' && bio.length > 500) {
        return NextResponse.json(
          { error: 'Bio must be 500 characters or less', field: 'bio' },
          { status: 400 }
        )
      }
      updateData.bio = bio || null
    }

    // Validate and set readingGoal (1-500)
    if (readingGoal !== undefined) {
      const goal = Number(readingGoal)
      if (isNaN(goal) || goal < 1 || goal > 500) {
        return NextResponse.json(
          { error: 'Reading goal must be between 1 and 500', field: 'readingGoal' },
          { status: 400 }
        )
      }
      updateData.readingGoal = goal
    }

    // Validate and set showCurrentlyReading (boolean)
    if (showCurrentlyReading !== undefined) {
      updateData.showCurrentlyReading = Boolean(showCurrentlyReading)
    }

    // Validate and set profileEnabled (boolean)
    if (profileEnabled !== undefined) {
      updateData.profileEnabled = Boolean(profileEnabled)
    }

    // Validate and set showTbr (boolean)
    if (showTbr !== undefined) {
      updateData.showTbr = Boolean(showTbr)
    }

    // If no fields to update, return current data
    if (Object.keys(updateData).length === 0) {
      const currentData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          name: true,
          username: true,
          bio: true,
          profilePictureUrl: true,
          readingGoal: true,
          showCurrentlyReading: true,
          profileEnabled: true,
          showTbr: true,
          image: true,
          email: true,
        },
      })
      return NextResponse.json(currentData)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        name: true,
        username: true,
        bio: true,
        profilePictureUrl: true,
        readingGoal: true,
        showCurrentlyReading: true,
        profileEnabled: true,
        showTbr: true,
        image: true,
        email: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
