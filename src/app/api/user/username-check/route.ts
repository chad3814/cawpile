import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'

// Username validation regex: alphanumeric, hyphen, underscore only
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/

/**
 * GET /api/user/username-check?username=value
 * Checks if a username is available (case-insensitive)
 * Returns { available: boolean, message?: string }
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json(
        { available: false, message: 'Username is required' },
        { status: 400 }
      )
    }

    // Validate length
    if (username.length > 128) {
      return NextResponse.json({
        available: false,
        message: 'Username must be 128 characters or less',
      })
    }

    // Validate format
    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json({
        available: false,
        message: 'Username can only contain letters, numbers, hyphens, and underscores',
      })
    }

    // Check if username is taken (case-insensitive, excluding current user)
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
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: 'Username is already taken',
      })
    }

    return NextResponse.json({
      available: true,
      message: 'Username is available',
    })
  } catch (error) {
    console.error('Error checking username availability:', error)
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    )
  }
}
