import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getUserByUsername } from '@/lib/db/getUserProfile'
import { getProfileCurrentlyReading } from '@/lib/db/getProfileCurrentlyReading'
import { getProfileSharedReviews } from '@/lib/db/getProfileSharedReviews'
import { getProfileTbr } from '@/lib/db/getProfileTbr'
import ProfilePageClient from '@/components/profile/ProfilePageClient'
import { ProfileTbrData } from '@/types/profile'

interface PageProps {
  params: Promise<{
    username: string
  }>
}

/**
 * Generate SEO metadata for profile page
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params

  const user = await getUserByUsername(username)

  // Return noindex for non-existent or disabled profiles
  if (!user || !user.profileEnabled) {
    return {
      title: 'Profile Not Found | Cawpile',
      robots: 'noindex, nofollow'
    }
  }

  const displayName = user.name || user.username
  const description = user.bio
    ? user.bio.substring(0, 160)
    : `${displayName}'s reading profile on Cawpile`

  return {
    title: `${displayName}'s Profile | Cawpile`,
    description,
    robots: 'index, follow',
    openGraph: {
      title: `${displayName}'s Profile | Cawpile`,
      description,
      type: 'profile',
      images: user.profilePictureUrl || user.image
        ? [{ url: user.profilePictureUrl || user.image! }]
        : undefined
    },
    twitter: {
      card: 'summary',
      title: `${displayName}'s Profile | Cawpile`,
      description
    }
  }
}

/**
 * Public profile page server component
 * Fetches user data, currently reading books, TBR books, and shared reviews
 */
export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params

  // Fetch user profile with case-insensitive lookup
  const user = await getUserByUsername(username)

  // Return 404 if user doesn't exist or has disabled their profile
  if (!user || !user.profileEnabled) {
    notFound()
  }

  // Fetch currently reading books if user has enabled this setting
  let currentlyReading: Awaited<ReturnType<typeof getProfileCurrentlyReading>> = []
  if (user.showCurrentlyReading) {
    currentlyReading = await getProfileCurrentlyReading(user.id)
  }

  // Fetch TBR books if user has enabled this setting
  let tbr: ProfileTbrData | null = null
  if (user.showTbr) {
    tbr = await getProfileTbr(user.id)
  }

  // Fetch all shared reviews
  const sharedReviews = await getProfileSharedReviews(user.id)

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <ProfilePageClient
        user={user}
        currentlyReading={currentlyReading}
        sharedReviews={sharedReviews}
        tbr={tbr}
      />
    </div>
  )
}
