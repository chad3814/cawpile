'use client'

import { BookType } from '@/types/cawpile'
import { CawpileRating, getFacetConfig, getCawpileColor } from '@/types/cawpile'

interface CawpileFacetDisplayProps {
  rating: Partial<CawpileRating> | null
  bookType: BookType
  compact?: boolean
  className?: string
}

export default function CawpileFacetDisplay({
  rating,
  bookType,
  compact = false,
  className = ''
}: CawpileFacetDisplayProps) {
  if (!rating) {
    return null
  }

  const facets = getFacetConfig(bookType)

  if (compact) {
    return (
      <div className={`grid grid-cols-2 gap-2 text-sm ${className}`}>
        {facets.map((facet) => {
          const value = rating[facet.key]
          return (
            <div key={facet.key} className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {facet.name.split('/')[0]}:
              </span>
              <span className={value !== null && value !== undefined ? getCawpileColor(value) : 'text-gray-400'}>
                {value !== null && value !== undefined ? value : '--'}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {facets.map((facet) => {
        const value = rating[facet.key]
        return (
          <div key={facet.key} className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {facet.name}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {facet.description}
              </p>
            </div>
            <div className="text-right">
              {value !== null && value !== undefined ? (
                <span className={`text-2xl font-bold ${getCawpileColor(value)}`}>
                  {value}
                </span>
              ) : (
                <span className="text-2xl text-gray-400">--</span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">/10</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}