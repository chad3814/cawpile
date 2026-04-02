'use client'

import { useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface HeroScrollRowProps {
  children: ReactNode
  title?: string
}

/**
 * Paged hero carousel. The container clips overflow; left/right arrow buttons
 * in the title row advance the track by one container-width at a time via CSS transform.
 */
export default function HeroScrollRow({ children, title }: HeroScrollRowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [trackWidth, setTrackWidth] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth)
      if (trackRef.current) setTrackWidth(trackRef.current.scrollWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    if (trackRef.current) observer.observe(trackRef.current)
    return () => observer.disconnect()
  }, [])

  const maxOffset = Math.max(0, trackWidth - containerWidth)
  const rawOffset = page * containerWidth
  const offset = Math.min(rawOffset, maxOffset)
  const canGoBack = offset > 0
  const canGoForward = offset < maxOffset
  const hasOverflow = maxOffset > 0

  return (
    <div>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {hasOverflow && (
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={!canGoBack}
                className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeftIcon className="h-4 w-4 text-foreground" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
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
          ref={trackRef}
          className="flex gap-4 transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${offset}px)` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
