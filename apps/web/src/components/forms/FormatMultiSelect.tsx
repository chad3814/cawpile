'use client'

import { BookFormat } from '@prisma/client'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

interface FormatMultiSelectProps {
  selectedFormats: BookFormat[]
  onChange: (formats: BookFormat[]) => void
  className?: string
}

const formatOptions = [
  { value: BookFormat.HARDCOVER, label: 'Hardcover', icon: '📖', description: 'Physical hardcover book' },
  { value: BookFormat.PAPERBACK, label: 'Paperback', icon: '📗', description: 'Physical paperback book' },
  { value: BookFormat.EBOOK, label: 'E-Book', icon: '📱', description: 'Digital book for e-readers' },
  { value: BookFormat.AUDIOBOOK, label: 'Audiobook', icon: '🎧', description: 'Audio narration' },
]

export default function FormatMultiSelect({
  selectedFormats,
  onChange,
  className = ''
}: FormatMultiSelectProps) {
  const handleToggleFormat = (format: BookFormat) => {
    if (selectedFormats.includes(format)) {
      // Remove format if already selected
      const newFormats = selectedFormats.filter(f => f !== format)
      // Ensure at least one format remains selected
      if (newFormats.length > 0) {
        onChange(newFormats)
      }
    } else {
      // Add format if not selected
      onChange([...selectedFormats, format])
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {formatOptions.map((option) => {
        const isSelected = selectedFormats.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggleFormat(option.value)}
            className={`${
              isSelected
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
            } relative flex cursor-pointer rounded-lg px-5 py-4 border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 dark:focus-visible:ring-offset-gray-800 w-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
            role="checkbox"
            aria-checked={isSelected}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center">
                <div className="text-2xl mr-3">{option.icon}</div>
                <div className="text-sm text-left">
                  <p
                    className={`font-medium ${
                      isSelected ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {option.label}
                  </p>
                  <span
                    className={`inline ${
                      isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {option.description}
                  </span>
                </div>
              </div>
              {isSelected && (
                <div className="shrink-0 text-orange-600 dark:text-orange-400">
                  <CheckCircleIcon className="h-6 w-6" />
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
