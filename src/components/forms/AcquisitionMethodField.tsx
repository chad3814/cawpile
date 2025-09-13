'use client'

import { AcquisitionMethod } from '@/types/book'
import { RadioGroup } from '@headlessui/react'
import { CheckCircleIcon } from '@heroicons/react/20/solid'

interface AcquisitionMethodFieldProps {
  value?: AcquisitionMethod | null
  otherValue?: string
  onChange: (method: AcquisitionMethod | null, other?: string) => void
  disabled?: boolean
}

const acquisitionOptions = [
  { value: AcquisitionMethod.Purchased, label: 'Purchased' },
  { value: AcquisitionMethod.Library, label: 'Library' },
  { value: AcquisitionMethod.FriendBorrowed, label: 'Borrowed from Friend' },
  { value: AcquisitionMethod.Gift, label: 'Gift' },
  { value: AcquisitionMethod.Other, label: 'Other' },
]

export default function AcquisitionMethodField({
  value,
  otherValue,
  onChange,
  disabled = false
}: AcquisitionMethodFieldProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        How did you acquire this book?
      </label>

      <RadioGroup
        value={value || ''}
        onChange={(method) => onChange(method as AcquisitionMethod)}
        disabled={disabled}
      >
        <div className="space-y-2">
          {acquisitionOptions.map((option) => (
            <RadioGroup.Option
              key={option.value}
              value={option.value}
              className={({ active, checked }) =>
                `relative flex cursor-pointer rounded-lg px-4 py-3 shadow-sm focus:outline-none
                ${active ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
                ${checked ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
                border transition-colors`
              }
            >
              {({ checked }) => (
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <RadioGroup.Label
                        as="p"
                        className={`font-medium ${
                          checked ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {option.label}
                      </RadioGroup.Label>
                    </div>
                  </div>
                  {checked && (
                    <div className="shrink-0 text-indigo-600 dark:text-indigo-400">
                      <CheckCircleIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>

      {value === AcquisitionMethod.Other && (
        <div className="mt-3">
          <input
            type="text"
            value={otherValue || ''}
            onChange={(e) => onChange(AcquisitionMethod.Other, e.target.value)}
            placeholder="Please specify..."
            maxLength={100}
            disabled={disabled}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {otherValue?.length || 0}/100 characters
          </p>
        </div>
      )}
    </div>
  )
}