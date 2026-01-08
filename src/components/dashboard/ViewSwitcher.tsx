"use client"

import { useState, useEffect } from 'react'
import BookGrid from './BookGrid'
import BookTable from './BookTable'
import { BookStatus, BookFormat } from '@prisma/client'

interface BookData {
  id: string
  status: BookStatus
  format: BookFormat[]
  progress: number
  startDate: Date | null
  finishDate: Date | null
  createdAt: Date
  edition: {
    id: string
    title: string | null
    book: {
      title: string
      authors: string[]
      bookType?: 'FICTION' | 'NONFICTION'
    }
    googleBook: {
      imageUrl: string | null
      description: string | null
      pageCount: number | null
    } | null
  }
  cawpileRating?: {
    id: string
    average: number
    characters: number | null
    atmosphere: number | null
    writing: number | null
    plot: number | null
    intrigue: number | null
    logic: number | null
    enjoyment: number | null
  } | null
}

interface ViewSwitcherProps {
  books: BookData[]
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