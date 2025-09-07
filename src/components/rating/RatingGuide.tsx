'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { RATING_SCALE_GUIDE } from '@/types/cawpile'

interface RatingGuideProps {
  className?: string
  iconOnly?: boolean
}

export default function RatingGuide({ className = '', iconOnly = false }: RatingGuideProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (iconOnly) {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${className}`}
        aria-label="Rating scale guide"
      >
        <QuestionMarkCircleIcon className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className={`${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
        <span>Rating Scale Guide</span>
        {isOpen ? (
          <ChevronUpIcon className="h-3 w-3" />
        ) : (
          <ChevronDownIcon className="h-3 w-3" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
          {RATING_SCALE_GUIDE.map((item) => (
            <div key={item.value} className="flex items-start gap-3 text-sm">
              <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[2rem]">
                {item.value}/10
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}