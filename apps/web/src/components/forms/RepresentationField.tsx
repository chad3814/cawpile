'use client'

import { RadioGroup } from '@headlessui/react'
import { RepresentationValue } from '@/types/book'

interface RepresentationFieldProps {
  label: string
  description?: string
  value: RepresentationValue | ''
  detailsValue: string
  onValueChange: (value: RepresentationValue | '') => void
  onDetailsChange: (details: string) => void
  detailsPlaceholder?: string
  detailsMaxLength?: number
}

export default function RepresentationField({
  label,
  description,
  value,
  detailsValue,
  onValueChange,
  onDetailsChange,
  detailsPlaceholder = 'Please provide details...',
  detailsMaxLength = 500
}: RepresentationFieldProps) {
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
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
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
            htmlFor={`${label.toLowerCase().replace(/\s+/g, '-')}-details`}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Details (optional)
          </label>
          <textarea
            id={`${label.toLowerCase().replace(/\s+/g, '-')}-details`}
            value={detailsValue}
            onChange={(e) => onDetailsChange(e.target.value)}
            maxLength={detailsMaxLength}
            rows={3}
            placeholder={detailsPlaceholder}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {detailsValue.length}/{detailsMaxLength} characters
          </p>
        </div>
      )}
    </div>
  )
}