'use client'

import { BookType } from '@/types/cawpile'
import {
  CawpileRating,
  getFacetConfig,
  calculateCawpileAverage,
  getCawpileGrade,
  getCawpileColor
} from '@/types/cawpile'
import StarRating from './StarRating'

interface RatingSummaryCardProps {
  rating: Partial<CawpileRating>
  bookType: BookType
  onDone: () => void
  onEdit: (facetIndex: number) => void
}

export default function RatingSummaryCard({
  rating,
  bookType,
  onDone,
  onEdit
}: RatingSummaryCardProps) {
  const facets = getFacetConfig(bookType)
  const average = calculateCawpileAverage(rating as CawpileRating)
  const grade = getCawpileGrade(average)

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Rating Summary
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here&apos;s your complete CAWPILE rating
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <StarRating rating={average} size="lg" />
        <div className="mt-2 flex items-center justify-center gap-4">
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {average.toFixed(1)}
          </span>
          <span className={`text-2xl font-bold ${getCawpileColor(average)}`}>
            {grade}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {facets.map((facet, index) => {
          const value = rating[facet.key]
          return (
            <div
              key={facet.key}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {facet.name}
                </h4>
              </div>
              <div className="flex items-center gap-3">
                {value !== null && value !== undefined ? (
                  <span className={`text-xl font-bold ${getCawpileColor(value)}`}>
                    {value}
                  </span>
                ) : (
                  <span className="text-xl text-gray-400">--</span>
                )}
                <button
                  onClick={() => onEdit(index)}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Edit
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onDone}
          className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          Done
        </button>
      </div>
    </div>
  )
}