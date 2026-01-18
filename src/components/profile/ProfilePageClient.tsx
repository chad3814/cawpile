'use client'

import { useState, useEffect } from 'react'
import ProfileHeader from './ProfileHeader'
import ProfileViewSwitcher from './ProfileViewSwitcher'
import SharedReviewsSection from './SharedReviewsSection'
import ProfileEmptyState from './ProfileEmptyState'
import LayoutToggle from '@/components/dashboard/LayoutToggle'
import { ProfileUserData, ProfileBookData, ProfileSharedReview } from '@/types/profile'

interface ProfilePageClientProps {
  user: ProfileUserData
  currentlyReading: ProfileBookData[]
  sharedReviews: ProfileSharedReview[]
}

const LAYOUT_STORAGE_KEY = 'profile-view-layout'

/**
 * Client component for profile page
 * Manages layout toggle state with localStorage persistence
 */
export default function ProfilePageClient({
  user,
  currentlyReading,
  sharedReviews
}: ProfilePageClientProps) {
  const [layout, setLayout] = useState<'GRID' | 'TABLE'>('GRID')
  const [isHydrated, setIsHydrated] = useState(false)

  // Load layout preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (stored === 'GRID' || stored === 'TABLE') {
      setLayout(stored)
    }
    setIsHydrated(true)
  }, [])

  // Persist layout changes to localStorage
  const handleLayoutChange = (newLayout: 'GRID' | 'TABLE') => {
    setLayout(newLayout)
    localStorage.setItem(LAYOUT_STORAGE_KEY, newLayout)
  }

  // Check if there's any public content to show
  const hasCurrentlyReading = user.showCurrentlyReading && currentlyReading.length > 0
  const hasEmptyCurrentlyReading = user.showCurrentlyReading && currentlyReading.length === 0
  const hasSharedReviews = sharedReviews.length > 0
  const hasNoContent = !hasCurrentlyReading && !hasEmptyCurrentlyReading && !hasSharedReviews

  return (
    <div className="max-w-5xl mx-auto">
      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Currently Reading Section */}
      {user.showCurrentlyReading && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Currently Reading
            </h2>
            {currentlyReading.length > 0 && (
              <div className={`transition-opacity duration-200 ${isHydrated ? 'opacity-100' : 'opacity-0'}`}>
                <LayoutToggle
                  currentLayout={layout}
                  onLayoutChange={handleLayoutChange}
                />
              </div>
            )}
          </div>
          {currentlyReading.length > 0 ? (
            <ProfileViewSwitcher books={currentlyReading} layout={layout} />
          ) : (
            <ProfileEmptyState variant="currently-reading" />
          )}
        </div>
      )}

      {/* Shared Reviews Section */}
      <div className="mt-8">
        <SharedReviewsSection reviews={sharedReviews} layout={layout} />
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
