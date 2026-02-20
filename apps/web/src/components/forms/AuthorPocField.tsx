'use client'

import { RadioGroup } from '@headlessui/react'
import { RepresentationValue } from '@/types/book'

interface AuthorPocFieldProps {
  value: RepresentationValue | ''
  detailsValue: string
  onValueChange: (value: RepresentationValue | '') => void
  onDetailsChange: (details: string) => void
}

export default function AuthorPocField({
  value,
  detailsValue,
  onValueChange,
  onDetailsChange
}: AuthorPocFieldProps) {
  const options: { value: RepresentationValue | ''; label: string }[] = [
    { value: RepresentationValue.Yes, label: 'Yes' },
    { value: RepresentationValue.No, label: 'No' },
    { value: RepresentationValue.Unknown, label: 'Unknown' },
    { value: '', label: 'Skip' }
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="text-base font-medium text-gray-900 dark:text-gray-100">
          Is the author a person of color?
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Help track diverse author representation
        </p>
      </div>

      <RadioGroup value={value} onChange={onValueChange}>
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <RadioGroup.Option
              key={option.value || 'skip'}
              value={option.value}
              className={({ active, checked }) =>
                `${
                  active
                    ? 'ring-2 ring-orange-500'
                    : ''
                }
                ${
                  checked
                    ? 'bg-orange-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }
                relative flex cursor-pointer rounded-lg px-4 py-3 shadow-md focus:outline-none`
              }
            >
              {({ checked }) => (
                <div className="flex w-full items-center justify-center">
                  <RadioGroup.Label
                    as="span"
                    className={`font-medium ${
                      checked ? 'text-white' : ''
                    }`}
                  >
                    {option.label}
                  </RadioGroup.Label>
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>

      {value === RepresentationValue.Yes && (
        <div>
          <label
            htmlFor="author-poc-details"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Author nationality/ethnicity (optional)
          </label>
          <input
            type="text"
            id="author-poc-details"
            value={detailsValue}
            onChange={(e) => onDetailsChange(e.target.value)}
            maxLength={200}
            placeholder="e.g., Nigerian-American, Japanese, Indigenous Australian"
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {detailsValue.length}/200 characters
          </p>
        </div>
      )}
    </div>
  )
}