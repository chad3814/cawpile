'use client'

import SharedReviewsCarousel from './SharedReviewsCarousel'
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

  return <SharedReviewsCarousel reviews={reviews} title="Shared Reviews" />
}
