'use client'

import SharedReviewCard from './SharedReviewCard'
import ProfileEmptyState from './ProfileEmptyState'
import { ProfileSharedReview } from '@/types/profile'

interface SharedReviewsSectionProps {
  reviews: ProfileSharedReview[]
}

/**
 * Shared reviews section for profile page
 * Displays grid of SharedReviewCard components with section heading
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <SharedReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
