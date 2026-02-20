'use client'

import { BookType, CawpileRating, getFacetConfig } from '@/types/cawpile'

interface PublicCawpileFacetDisplayProps {
  rating: Partial<CawpileRating> | null
  bookType: BookType
  className?: string
}

export default function PublicCawpileFacetDisplay({
  rating,
  bookType,
  className = ''
}: PublicCawpileFacetDisplayProps) {
  if (!rating) {
    return null
  }

  const facets = getFacetConfig(bookType)

  return (
    <div className={`space-y-4 ${className}`}>
      {facets.map((facet) => {
        const value = rating[facet.key]
        // Extract first letter from facet name (handles "Credibility/Research" -> "C")
        const letter = facet.name.charAt(0).toUpperCase()

        return (
          <div key={facet.key} className="flex items-center gap-4">
            {/* Box with Letter + Word */}
            <div className="flex flex-col items-center justify-center bg-muted border border-border rounded-lg px-4 py-3 min-w-[100px]">
              <span className="text-3xl font-bold text-card-foreground">
                {letter}
              </span>
              <span className="text-sm text-card-foreground">
                {facet.name}
              </span>
            </div>

            {/* Rating Number with /10 suffix */}
            <div className="flex items-baseline gap-1 min-w-[60px]">
              <span className="text-2xl font-bold text-card-foreground">
                {value !== null && value !== undefined ? value : '--'}
              </span>
              <span className="text-sm text-muted-foreground">/10</span>
            </div>

            {/* Description - hidden on mobile */}
            <p className="hidden sm:block text-muted-foreground flex-1">
              {facet.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
