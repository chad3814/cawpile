'use client'

import SharedReviewsCarousel from './SharedReviewsCarousel'
import { ProfileSharedReview } from '@/types/profile'

interface SharedReviewsSectionProps {
  reviews: ProfileSharedReview[]
}

/**
 * Shared reviews section for profile page
 * Displays reviews as a horizontal scroll carousel
 */
export default function SharedReviewsSection({ reviews }: SharedReviewsSectionProps) {
  return <SharedReviewsCarousel reviews={reviews} title="Shared Reviews" />
}
