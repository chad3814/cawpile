'use client'

interface HeroScrollRowProps {
  children: React.ReactNode
}

/**
 * Horizontal scroll container for hero carousel sections.
 * Each direct child should have `shrink-0` and a fixed width.
 */
export default function HeroScrollRow({ children }: HeroScrollRowProps) {
  return (
    <div className="flex overflow-x-auto gap-4 pb-3">
      {children}
    </div>
  )
}
