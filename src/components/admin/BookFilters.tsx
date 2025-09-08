'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'

interface BookFiltersProps {
  bookType: string
  language: string
  onBookTypeChange: (type: string) => void
  onLanguageChange: (language: string) => void
  onReset: () => void
}

export default function BookFilters({
  bookType,
  language,
  onBookTypeChange,
  onLanguageChange,
  onReset
}: BookFiltersProps) {
  const hasActiveFilters = bookType || language

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center space-x-2">
        <label htmlFor="bookType" className="text-sm font-medium text-gray-700">
          Type:
        </label>
        <select
          id="bookType"
          value={bookType}
          onChange={(e) => onBookTypeChange(e.target.value)}
          className="rounded-md border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">All</option>
          <option value="FICTION">Fiction</option>
          <option value="NONFICTION">Non-Fiction</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <label htmlFor="language" className="text-sm font-medium text-gray-700">
          Language:
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded-md border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">All</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="nl">Dutch</option>
          <option value="ru">Russian</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
        </select>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Reset Filters
        </button>
      )}

      {hasActiveFilters && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {bookType && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Type: {bookType === 'FICTION' ? 'Fiction' : 'Non-Fiction'}
            </span>
          )}
          {language && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Language: {language.toUpperCase()}
            </span>
          )}
        </div>
      )}
    </div>
  )
}