'use client'

import SharedReviewCard from './SharedReviewCard'
import { ProfileSharedReview } from '@/types/profile'

interface SharedReviewsViewSwitcherProps {
  reviews: ProfileSharedReview[]
}

/**
 * Vertical column grid for shared reviews section (4 columns, fills downward)
 */
export default function SharedReviewsViewSwitcher({ reviews }: SharedReviewsViewSwitcherProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {reviews.map((review) => (
        <SharedReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}
