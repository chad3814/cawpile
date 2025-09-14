"use client"

import { useState, useEffect } from 'react'
import BookGrid from './BookGrid'
import BookTable from './BookTable'

interface ViewSwitcherProps {
  books: any[]
  layout: 'GRID' | 'TABLE'
}

export default function ViewSwitcher({ books, layout }: ViewSwitcherProps) {
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
          <BookGrid books={books} />
        ) : (
          <BookTable books={books} />
        )}
      </div>
    </div>
  )
}