'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface HeroScrollRowProps {
  children: React.ReactNode
}

/**
 * Paged hero carousel. The container clips overflow; left/right arrow buttons
 * advance the track by one container-width at a time via CSS transform.
 */
export default function HeroScrollRow({ children }: HeroScrollRowProps) {
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

  return (
    <div className="relative">
      {canGoBack && (
        <button
          onClick={() => setPage(p => p - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-card border border-border rounded-full p-1.5 shadow-md hover:bg-muted transition-colors"
          aria-label="Previous"
        >
          <ChevronLeftIcon className="h-5 w-5 text-foreground" />
        </button>
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

      {canGoForward && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-card border border-border rounded-full p-1.5 shadow-md hover:bg-muted transition-colors"
          aria-label="Next"
        >
          <ChevronRightIcon className="h-5 w-5 text-foreground" />
        </button>
      )}
    </div>
  )
}
