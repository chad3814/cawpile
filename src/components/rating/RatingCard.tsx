'use client'

import { useState, useEffect } from 'react'
import { CawpileFacet } from '@/types/cawpile'
import RatingGuide from './RatingGuide'

interface RatingCardProps {
  facet: CawpileFacet
  value: number | null
  onChange: (value: number | null) => void
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  onViewSummary?: () => void
  isFirst: boolean
  isLast: boolean
}

export default function RatingCard({
  facet,
  value,
  onChange,
  onNext,
  onPrevious,
  onSkip,
  onViewSummary,
  isFirst,
  isLast
}: RatingCardProps) {
  const [localValue, setLocalValue] = useState(value || 5)
  const [hasInteracted, setHasInteracted] = useState(value !== null)

  useEffect(() => {
    if (value !== null) {
      // Editing mode: facet has an existing value
      setLocalValue(value)
      setHasInteracted(true)
    } else {
      // New facet: reset to default
      setLocalValue(5)
      setHasInteracted(false)
    }
  }, [facet.key, value])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    setLocalValue(newValue)
    setHasInteracted(true)
    onChange(newValue)
  }

  const handleSkip = () => {
    onChange(null)
    onSkip()
  }

  const handleViewSummary = () => {
    // Save current facet rating if user has interacted before jumping to summary
    if (hasInteracted && value === null) {
      onChange(localValue)
    }
    onViewSummary?.()
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {facet.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {facet.description}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-4xl font-bold text-primary">
            {value !== null ? value : localValue}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            / 10
          </span>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="1"
            max="10"
            value={value !== null ? value : localValue}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <span key={num}>{num}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 dark:text-gray-300">
          Consider these questions:
        </h4>
        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {facet.questions.map((question, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </div>

      <RatingGuide className="mt-4" />

      <div className="flex justify-between gap-3 pt-4">
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Previous
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Skip This Facet
          </button>

          {onViewSummary && (
            <button
              onClick={handleViewSummary}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              View Summary
            </button>
          )}
        </div>

        <button
          onClick={() => {
            // If user hasn't interacted with slider, use the default value
            if (!hasInteracted && value === null) {
              onChange(localValue)
            }
            onNext()
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          {isLast ? 'View Summary' : 'Next'}
        </button>
      </div>
    </div>
  )
}
