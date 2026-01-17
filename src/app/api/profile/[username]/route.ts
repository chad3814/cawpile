import { NextResponse } from 'next/server'
import { getUserByUsername } from '@/lib/db/getUserProfile'
import { getProfileCurrentlyReading } from '@/lib/db/getProfileCurrentlyReading'
import { getProfileSharedReviews } from '@/lib/db/getProfileSharedReviews'

interface RouteParams {
  params: Promise<{
    username: string
  }>
}

/**
 * GET /api/profile/[username]
 * Public endpoint - no authentication required
 * Returns user profile data, currently reading books (if enabled), and shared reviews
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { username } = await params

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }

    // Fetch user profile with case-insensitive lookup
    const user = await getUserByUsername(username)

    if (!user) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Fetch currently reading books if user has enabled this setting
    let currentlyReading: Awaited<ReturnType<typeof getProfileCurrentlyReading>> = []
    if (user.showCurrentlyReading) {
      currentlyReading = await getProfileCurrentlyReading(user.id)
    }

    // Fetch all shared reviews
    const sharedReviews = await getProfileSharedReviews(user.id)

    // Format response - omit internal user id from response
    const response = {
      user: {
        name: user.name,
        username: user.username,
        bio: user.bio,
        profilePictureUrl: user.profilePictureUrl,
        image: user.image,
        showCurrentlyReading: user.showCurrentlyReading
      },
      currentlyReading,
      sharedReviews
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
