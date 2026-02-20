'use client'

import { Switch } from '@headlessui/react'

interface RereadFieldProps {
  value?: boolean | null
  onChange: (value: boolean) => void
  disabled?: boolean
}

export default function RereadField({ value, onChange, disabled = false }: RereadFieldProps) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor="reread" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Is this a re-read?
      </label>
      <Switch
        id="reread"
        checked={value || false}
        onChange={onChange}
        disabled={disabled}
        className={`${
          value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
      >
        <span className="sr-only">Toggle re-read status</span>
        <span
          className={`${
            value ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </div>
  )
}