'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import SharedReviewCard from './SharedReviewCard'
import { ProfileSharedReview } from '@/types/profile'

const ROWS = 4
const COL_BREAKPOINT = 480

interface SharedReviewsCarouselProps {
  reviews: ProfileSharedReview[]
  title?: string
}

/**
 * Paged hero carousel for shared reviews.
 * Each page is a 2-column × 4-row grid (or 1-column × 4-row on narrow viewports).
 * Left/right arrows sit in the title row on the right.
 */
export default function SharedReviewsCarousel({ reviews, title }: SharedReviewsCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [cols, setCols] = useState(2)

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      setContainerWidth(w)
      setCols(w >= COL_BREAKPOINT ? 2 : 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Reset to first page when column count changes (viewport resize crosses breakpoint)
  useEffect(() => {
    setPage(0)
  }, [cols])

  const pageSize = cols * ROWS

  const pages: ProfileSharedReview[][] = []
  for (let i = 0; i < reviews.length; i += pageSize) {
    pages.push(reviews.slice(i, i + pageSize))
  }

  const totalPages = Math.max(1, pages.length)
  const clampedPage = Math.min(page, totalPages - 1)
  const offset = clampedPage * containerWidth
  const canGoBack = clampedPage > 0
  const canGoForward = clampedPage < totalPages - 1

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={!canGoBack}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeftIcon className="h-4 w-4 text-foreground" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={!canGoForward}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                aria-label="Next"
              >
                <ChevronRightIcon className="h-4 w-4 text-foreground" />
              </button>
            </div>
          )}
        </div>
      )}

      <div ref={containerRef} className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${offset}px)` }}
        >
          {pages.map((pageReviews, i) => (
            <div
              key={i}
              className="shrink-0"
              style={{ width: containerWidth > 0 ? containerWidth : undefined }}
            >
              <div className={`grid gap-4 ${cols >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {pageReviews.map(review => (
                  <SharedReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
