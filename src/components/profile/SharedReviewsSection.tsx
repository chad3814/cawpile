'use client'

import SharedReviewsViewSwitcher from './SharedReviewsViewSwitcher'
import ProfileEmptyState from './ProfileEmptyState'
import { ProfileSharedReview } from '@/types/profile'

interface SharedReviewsSectionProps {
  reviews: ProfileSharedReview[]
}

/**
 * Shared reviews section for profile page
 * Displays reviews as a horizontal scroll carousel
 */
export default function SharedReviewsSection({ reviews }: SharedReviewsSectionProps) {
  if (reviews.length === 0) {
    return <ProfileEmptyState variant="reviews" />
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Shared Reviews
      </h2>
      <SharedReviewsViewSwitcher reviews={reviews} />
    </div>
  )
}
