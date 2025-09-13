'use client'

import { RadioGroup } from '@headlessui/react'

interface NewAuthorFieldProps {
  value: boolean | null
  onChange: (value: boolean | null) => void
}

export default function NewAuthorField({
  value,
  onChange
}: NewAuthorFieldProps) {
  const options: { value: boolean | null; label: string }[] = [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
    { value: null, label: 'Skip' }
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="text-base font-medium text-gray-900 dark:text-gray-100">
          Is this a new author for you?
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Track your reading diversity by noting first-time authors
        </p>
      </div>

      <RadioGroup value={value} onChange={onChange}>
        <div className="grid grid-cols-3 gap-3">
          {options.map((option) => (
            <RadioGroup.Option
              key={option.value === null ? 'skip' : option.value.toString()}
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
    </div>
  )
}