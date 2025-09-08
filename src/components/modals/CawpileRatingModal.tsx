'use client'

import { useState, useCallback } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { BookType } from '@/types/cawpile'
import {
  CawpileRating,
  getFacetConfig
} from '@/types/cawpile'
import RatingCard from '../rating/RatingCard'
import RatingSummaryCard from '../rating/RatingSummaryCard'
import { useRouter } from 'next/navigation'

interface CawpileRatingModalProps {
  isOpen: boolean
  onClose: () => void
  bookId: string
  bookType: BookType
  bookTitle: string
  initialRating?: Partial<CawpileRating> | null
}

export default function CawpileRatingModal({
  isOpen,
  onClose,
  bookId,
  bookType,
  bookTitle,
  initialRating
}: CawpileRatingModalProps) {
  const router = useRouter()
  const facets = getFacetConfig(bookType)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ratings, setRatings] = useState<Partial<CawpileRating>>(() => {
    if (initialRating) return { ...initialRating }
    return {
      characters: null,
      atmosphere: null,
      writing: null,
      plot: null,
      intrigue: null,
      logic: null,
      enjoyment: null
    }
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Auto-save when ratings change
  const saveRatings = useCallback(async () => {
    if (isSaving) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await fetch(`/api/user/books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cawpileRating: ratings
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save rating')
      }

      router.refresh()
    } catch (error) {
      console.error('Error saving rating:', error)
      setSaveError('Failed to save rating. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [bookId, ratings, isSaving, router])

  const handleRatingChange = (facetKey: keyof CawpileRating, value: number | null) => {
    setRatings(prev => ({
      ...prev,
      [facetKey]: value
    }))
  }

  const handleNext = () => {
    if (currentIndex < facets.length) {
      // Save current rating before moving to next
      const currentFacet = facets[currentIndex]
      if (ratings[currentFacet.key] !== null) {
        saveRatings()
      }
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  const handleEdit = (facetIndex: number) => {
    setCurrentIndex(facetIndex)
  }

  const handleDone = async () => {
    await saveRatings()
    onClose()
  }

  const isShowingSummary = currentIndex === facets.length

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white dark:bg-gray-900 rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Rate &quot;{bookTitle}&quot;
              </Dialog.Title>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                CAWPILE Rating System
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {!isShowingSummary && (
            <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {facets.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index === currentIndex
                          ? 'bg-primary'
                          : index < currentIndex
                          ? 'bg-primary/50'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                {isSaving && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Saving...
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto">
            {isShowingSummary ? (
              <RatingSummaryCard
                rating={ratings}
                bookType={bookType}
                onDone={handleDone}
                onEdit={handleEdit}
              />
            ) : (
              <RatingCard
                facet={facets[currentIndex]}
                value={ratings[facets[currentIndex].key] ?? null}
                onChange={(value) => handleRatingChange(facets[currentIndex].key, value)}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSkip={handleSkip}
                isFirst={currentIndex === 0}
                isLast={currentIndex === facets.length - 1}
              />
            )}
          </div>

          {saveError && (
            <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">
                {saveError}
              </p>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}