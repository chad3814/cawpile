'use client'

import SharedReviewCard from './SharedReviewCard'
import HeroScrollRow from '@/components/HeroScrollRow'
import { ProfileSharedReview } from '@/types/profile'

interface SharedReviewsViewSwitcherProps {
  reviews: ProfileSharedReview[]
}

/**
 * Horizontal scroll carousel for shared reviews section
 */
export default function SharedReviewsViewSwitcher({ reviews }: SharedReviewsViewSwitcherProps) {
  return (
    <HeroScrollRow>
      {reviews.map((review) => (
        <div key={review.id} className="shrink-0 w-64">
          <SharedReviewCard review={review} />
        </div>
      ))}
    </HeroScrollRow>
  )
}
