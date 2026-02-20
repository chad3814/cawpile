'use client'

import SharedReviewsViewSwitcher from './SharedReviewsViewSwitcher'
import ProfileEmptyState from './ProfileEmptyState'
import { ProfileSharedReview } from '@/types/profile'

interface SharedReviewsSectionProps {
  reviews: ProfileSharedReview[]
  layout: 'GRID' | 'TABLE'
}

/**
 * Shared reviews section for profile page
 * Displays reviews using SharedReviewsViewSwitcher based on layout prop
 */
export default function SharedReviewsSection({ reviews, layout }: SharedReviewsSectionProps) {
  if (reviews.length === 0) {
    return <ProfileEmptyState variant="reviews" />
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Shared Reviews
      </h2>
      <SharedReviewsViewSwitcher reviews={reviews} layout={layout} />
    </div>
  )
}
