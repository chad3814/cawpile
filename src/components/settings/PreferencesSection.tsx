'use client'

import { useState } from 'react'
import { Switch } from '@headlessui/react'

interface PreferencesData {
  readingGoal: number
  showCurrentlyReading: boolean
}

interface PreferencesSectionProps {
  data: PreferencesData
  onUpdate: (updates: Partial<PreferencesData>) => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export default function PreferencesSection({
  data,
  onUpdate,
  onSuccess,
  onError,
}: PreferencesSectionProps) {
  const [readingGoal, setReadingGoal] = useState(data.readingGoal)
  const [showCurrentlyReading, setShowCurrentlyReading] = useState(data.showCurrentlyReading)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (readingGoal < 1 || readingGoal > 500) {
      onError('Reading goal must be between 1 and 500')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingGoal,
          showCurrentlyReading,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update preferences')
      }

      onUpdate({
        readingGoal: result.readingGoal,
        showCurrentlyReading: result.showCurrentlyReading,
      })
      onSuccess('Preferences updated successfully')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update preferences')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
        Reading Preferences
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reading Goal */}
        <div>
          <label
            htmlFor="readingGoal"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Annual Reading Goal
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              id="readingGoal"
              value={readingGoal}
              onChange={(e) => setReadingGoal(Number(e.target.value))}
              min={1}
              max={500}
              className="block w-32 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              books per year
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Set your reading goal for the year (1-500 books)
          </p>
        </div>

        {/* Public Currently Reading Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label
              htmlFor="showCurrentlyReading"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Show my currently reading books publicly
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              When enabled, your currently reading books will be visible on your public profile
              (public profiles coming soon)
            </p>
          </div>
          <Switch
            checked={showCurrentlyReading}
            onChange={setShowCurrentlyReading}
            className={`${
              showCurrentlyReading ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
          >
            <span className="sr-only">Show currently reading publicly</span>
            <span
              className={`${
                showCurrentlyReading ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  )
}
