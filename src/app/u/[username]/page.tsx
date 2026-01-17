import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getUserByUsername } from '@/lib/db/getUserProfile'
import { getProfileCurrentlyReading } from '@/lib/db/getProfileCurrentlyReading'
import { getProfileSharedReviews } from '@/lib/db/getProfileSharedReviews'
import ProfilePageClient from '@/components/profile/ProfilePageClient'

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

  if (!user) {
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
 * Fetches user data, currently reading books, and shared reviews
 */
export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params

  // Fetch user profile with case-insensitive lookup
  const user = await getUserByUsername(username)

  if (!user) {
    notFound()
  }

  // Fetch currently reading books if user has enabled this setting
  let currentlyReading: Awaited<ReturnType<typeof getProfileCurrentlyReading>> = []
  if (user.showCurrentlyReading) {
    currentlyReading = await getProfileCurrentlyReading(user.id)
  }

  // Fetch all shared reviews
  const sharedReviews = await getProfileSharedReviews(user.id)

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <ProfilePageClient
        user={user}
        currentlyReading={currentlyReading}
        sharedReviews={sharedReviews}
      />
    </div>
  )
}
