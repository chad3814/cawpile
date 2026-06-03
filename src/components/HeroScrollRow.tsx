'use client'

import { useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface HeroScrollRowProps {
  children: ReactNode
  title?: string
  titleHref?: string
}

/**
 * Pixels to advance per page: the largest whole number of items that fit in
 * the container, expressed as a multiple of the item stride (card width + gap).
 *
 * Paging by the raw container width lands each boundary mid-item, slicing
 * whichever card straddles the edge — the sliced card then appears cut off at
 * both the end of one page and the start of the next. A whole-item step keeps
 * every page boundary on an item edge.
 *
 * `stride` is the distance between consecutive item starts (cardWidth + gap).
 * Falls back to `containerWidth` when dimensions aren't measurable yet.
 */
export function computePageStep(
  containerWidth: number,
  cardWidth: number,
  stride: number
): number {
  if (stride <= 0 || containerWidth <= 0) return containerWidth
  // n items occupy n*stride - gap of width (the last item needs no trailing
  // gap), so the count that fits is floor((containerWidth + gap) / stride).
  const gap = Math.max(0, stride - cardWidth)
  const itemsPerPage = Math.max(1, Math.floor((containerWidth + gap) / stride))
  return itemsPerPage * stride
}

/**
 * Paged hero carousel. The container clips overflow; left/right arrow buttons
 * in the title row advance the track by one page at a time via CSS transform.
 *
 * A page advances by the largest whole number of items that fit in the
 * container, not by the raw container width. Paging by container width would
 * land each boundary mid-item, slicing whichever card straddles the edge so
 * the same card appears cut off at the end of one page and the start of the
 * next. Stepping by a whole-item stride keeps every page boundary on an item
 * edge. (The final page still clamps flush-right to reveal the last items.)
 */
export default function HeroScrollRow({ children, title, titleHref }: HeroScrollRowProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [trackWidth, setTrackWidth] = useState(0)
  const [pageStep, setPageStep] = useState(0)

  useEffect(() => {
    const measure = () => {
      const newContainerWidth = containerRef.current?.clientWidth ?? 0
      const newTrackWidth = trackRef.current?.scrollWidth ?? 0

      // Derive the per-item stride (card width + gap) from the rendered track so
      // paging can advance in whole items regardless of the card/gap sizes the
      // caller uses. offsetLeft delta between the first two items captures both.
      const items = trackRef.current?.children
      const first = items && items.length > 0 ? (items[0] as HTMLElement) : null
      const cardWidth = first?.offsetWidth ?? 0
      const stride =
        items && items.length > 1
          ? (items[1] as HTMLElement).offsetLeft - (items[0] as HTMLElement).offsetLeft
          : cardWidth

      const newPageStep = computePageStep(newContainerWidth, cardWidth, stride)

      setContainerWidth(newContainerWidth)
      setTrackWidth(newTrackWidth)
      setPageStep(newPageStep)
      // Clamp page so it stays within the new valid range after resize
      if (newContainerWidth > 0 && newPageStep > 0) {
        const newMaxOffset = Math.max(0, newTrackWidth - newContainerWidth)
        const maxPage = newMaxOffset > 0 ? Math.ceil(newMaxOffset / newPageStep) : 0
        setPage(p => Math.min(p, maxPage))
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    if (trackRef.current) observer.observe(trackRef.current)
    return () => observer.disconnect()
  }, [])

  const maxOffset = Math.max(0, trackWidth - containerWidth)
  const rawOffset = page * pageStep
  const offset = Math.min(rawOffset, maxOffset)
  const canGoBack = offset > 0
  const canGoForward = offset < maxOffset
  const hasOverflow = maxOffset > 0

  const navButtons = hasOverflow ? (
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
  ) : null

  return (
    <div>
      {(title || navButtons) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h2 className="text-xl font-semibold text-foreground">
              {titleHref ? (
                <Link href={titleHref} className="text-foreground hover:text-primary transition-colors">
                  {title}
                </Link>
              ) : (
                title
              )}
            </h2>
          )}
          {navButtons && <div className={title ? undefined : 'ml-auto'}>{navButtons}</div>}
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
