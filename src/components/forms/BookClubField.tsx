'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@headlessui/react'
import { Combobox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

interface BookClubFieldProps {
  value?: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
}

export default function BookClubField({ value, onChange, disabled = false }: BookClubFieldProps) {
  const [isBookClub, setIsBookClub] = useState(!!value)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Fetch suggestions from API
  useEffect(() => {
    if (query.length > 0) {
      fetch(`/api/user/book-clubs?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data.bookClubs) {
            setSuggestions(data.bookClubs.map((club: any) => club.name))
          }
        })
        .catch(console.error)
    } else {
      // Fetch all when no query
      fetch('/api/user/book-clubs')
        .then(res => res.json())
        .then(data => {
          if (data.bookClubs) {
            setSuggestions(data.bookClubs.map((club: any) => club.name))
          }
        })
        .catch(console.error)
    }
  }, [query])

  const handleToggle = (enabled: boolean) => {
    setIsBookClub(enabled)
    if (!enabled) {
      onChange(null)
      setQuery('')
    }
  }

  const filteredSuggestions =
    query === ''
      ? suggestions
      : suggestions.filter((suggestion) =>
          suggestion.toLowerCase().includes(query.toLowerCase())
        )

  // Add current query as an option if it's not in suggestions
  if (query && !filteredSuggestions.includes(query)) {
    filteredSuggestions.push(query)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Is this for a book club?
        </label>
        <Switch
          checked={isBookClub}
          onChange={handleToggle}
          disabled={disabled}
          className={`${
            isBookClub ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
          } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
        >
          <span className="sr-only">Book club toggle</span>
          <span
            className={`${
              isBookClub ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </Switch>
      </div>

      {isBookClub && (
        <div>
          <Combobox value={value || ''} onChange={onChange} disabled={disabled}>
            <div className="relative">
              <Combobox.Input
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 pr-10"
                onChange={(event) => setQuery(event.target.value)}
                displayValue={(item: string) => item}
                placeholder="Enter book club name..."
                maxLength={100}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </Combobox.Button>

              <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredSuggestions.length === 0 && query !== '' ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                    Type to create "{query}"
                  </div>
                ) : (
                  filteredSuggestions.map((suggestion) => (
                    <Combobox.Option
                      key={suggestion}
                      value={suggestion}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? 'bg-indigo-600 text-white' : 'text-gray-900 dark:text-gray-100'
                        }`
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {suggestion}
                          </span>
                          {selected && (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? 'text-white' : 'text-indigo-600'
                              }`}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {(value || query).length}/100 characters
          </p>
        </div>
      )}
    </div>
  )
}