'use client'

import { useState, useEffect } from 'react'
import ProfileBookGrid from './ProfileBookGrid'
import ProfileBookTable from './ProfileBookTable'
import { ProfileBookData } from '@/types/profile'

interface ProfileViewSwitcherProps {
  books: ProfileBookData[]
  layout: 'GRID' | 'TABLE'
}

/**
 * Animated view switcher for profile page
 * Switches between ProfileBookGrid and ProfileBookTable with animation
 */
export default function ProfileViewSwitcher({ books, layout }: ProfileViewSwitcherProps) {
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
          <ProfileBookGrid books={books} />
        ) : (
          <ProfileBookTable books={books} />
        )}
      </div>
    </div>
  )
}
