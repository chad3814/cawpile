'use client'

import { useState, useEffect } from 'react'
import SharedReviewCard from './SharedReviewCard'
import SharedReviewsTable from './SharedReviewsTable'
import { ProfileSharedReview } from '@/types/profile'

interface SharedReviewsViewSwitcherProps {
  reviews: ProfileSharedReview[]
  layout: 'GRID' | 'TABLE'
}

/**
 * Animated view switcher for shared reviews section
 * Switches between grid (SharedReviewCard) and table (SharedReviewsTable) with animation
 */
export default function SharedReviewsViewSwitcher({ reviews, layout }: SharedReviewsViewSwitcherProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentView, setCurrentView] = useState(layout)

  useEffect(() => {
    if (layout !== currentView) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setCurrentView(layout)
        setIsAnimating(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [layout, currentView])

  return (
    <div className="relative overflow-hidden">
      <div
        className={`transition-all duration-300 ease-in-out ${
          isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
        }`}
      >
        {currentView === 'GRID' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <SharedReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <SharedReviewsTable reviews={reviews} />
        )}
      </div>
    </div>
  )
}
