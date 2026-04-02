'use client'

import ProfileHeader from './ProfileHeader'
import ProfileBookGrid from './ProfileBookGrid'
import SharedReviewsSection from './SharedReviewsSection'
import TbrSection from './TbrSection'
import ProfileEmptyState from './ProfileEmptyState'
import { ProfileUserData, ProfileBookData, ProfileSharedReview, ProfileTbrData } from '@/types/profile'

interface ProfilePageClientProps {
  user: ProfileUserData
  currentlyReading: ProfileBookData[]
  sharedReviews: ProfileSharedReview[]
  tbr: ProfileTbrData | null
}

/**
 * Client component for profile page
 * Each section displays as a horizontal scroll hero carousel
 */
export default function ProfilePageClient({
  user,
  currentlyReading,
  sharedReviews,
  tbr
}: ProfilePageClientProps) {
  // Check if there's any public content to show
  const hasCurrentlyReading = user.showCurrentlyReading && currentlyReading.length > 0
  const hasEmptyCurrentlyReading = user.showCurrentlyReading && currentlyReading.length === 0
  const hasTbr = user.showTbr && tbr && tbr.books.length > 0
  const hasEmptyTbr = user.showTbr && (!tbr || tbr.books.length === 0)
  const hasSharedReviews = sharedReviews.length > 0
  const hasNoContent = !hasCurrentlyReading && !hasEmptyCurrentlyReading && !hasTbr && !hasEmptyTbr && !hasSharedReviews

  return (
    <div className="max-w-5xl mx-auto">
      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Currently Reading Section */}
      {user.showCurrentlyReading && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Currently Reading
          </h2>
          {currentlyReading.length > 0 ? (
            <ProfileBookGrid books={currentlyReading} />
          ) : (
            <ProfileEmptyState variant="currently-reading" />
          )}
        </div>
      )}

      {/* TBR Section */}
      {user.showTbr && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Want to Read
          </h2>
          {tbr && tbr.books.length > 0 ? (
            <TbrSection tbr={tbr} />
          ) : (
            <ProfileEmptyState variant="tbr" />
          )}
        </div>
      )}

      {/* Shared Reviews Section */}
      <div className="mt-8">
        <SharedReviewsSection reviews={sharedReviews} />
      </div>

      {/* No Content State */}
      {hasNoContent && (
        <div className="mt-8">
          <ProfileEmptyState variant="no-content" />
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 py-4 border-t border-border">
        <p className="text-xs text-center text-muted-foreground">
          Powered by CAWPILE.org
        </p>
      </div>
    </div>
  )
}
