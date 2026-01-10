'use client'

import { ChangeEvent } from 'react'

interface ReviewTextareaFieldProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

export default function ReviewTextareaField({
  value,
  onChange,
  maxLength = 5000
}: ReviewTextareaFieldProps) {
  const charCount = value.length
  const isWarning = charCount > 4500
  const remaining = maxLength - charCount

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="book-review"
          className="text-base font-medium text-gray-900 dark:text-gray-100"
        >
          Your Review
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Write your thoughts about this book (optional)
        </p>
      </div>

      <div>
        <textarea
          id="book-review"
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          rows={7}
          placeholder="Share your thoughts about this book..."
          aria-label="Book review"
          aria-describedby="review-character-count"
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm px-3 py-2"
        />
        <div
          id="review-character-count"
          className={`mt-1 text-right text-xs ${
            isWarning
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          aria-live="polite"
          aria-atomic="true"
        >
          {charCount} / {maxLength}
          {isWarning && ` (${remaining} remaining)`}
        </div>
      </div>
    </div>
  )
}
