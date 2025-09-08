'use client'

import { useState, useEffect, useCallback } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface BookSearchProps {
  onSearch: (search: string, searchField: string) => void
  initialSearch?: string
  initialSearchField?: string
}

export default function BookSearch({ 
  onSearch, 
  initialSearch = '', 
  initialSearchField = 'title' 
}: BookSearchProps) {
  const [search, setSearch] = useState(initialSearch)
  const [searchField, setSearchField] = useState(initialSearchField)
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Trigger search when debounced value or field changes
  useEffect(() => {
    onSearch(debouncedSearch, searchField)
  }, [debouncedSearch, searchField, onSearch])

  const handleClear = () => {
    setSearch('')
    setDebouncedSearch('')
  }

  const handleFieldChange = (newField: string) => {
    setSearchField(newField)
  }

  return (
    <div className="flex space-x-2">
      <div className="relative flex-1 max-w-lg">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
          placeholder={`Search by ${searchField}...`}
        />
        {search && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
          </button>
        )}
      </div>
      <select
        value={searchField}
        onChange={(e) => handleFieldChange(e.target.value)}
        className="block px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
      >
        <option value="title">Title</option>
        <option value="author">Author</option>
        <option value="isbn">ISBN</option>
      </select>
    </div>
  )
}