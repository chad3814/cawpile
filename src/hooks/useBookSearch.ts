import { useState, useEffect, useCallback } from 'react'
import type { SignedBookSearchResult } from '@/lib/search/types'

/**
 * Search type: 'standard' for regular multi-provider search, 'tagged' for tagged lookups
 */
export type SearchType = 'standard' | 'tagged'

/**
 * API response shape for search endpoint
 */
interface SearchApiResponse {
  books: SignedBookSearchResult[]
  taggedSearch: boolean
  provider?: string
  error?: string
}

/**
 * Detects if query contains tagged search syntax at the start
 * Returns the tag type if found, null otherwise
 */
function detectTaggedSearch(query: string): string | null {
  if (!query) return null

  const tagPattern = /^(ibdb|hard|gbid|isbn):/i
  const match = query.match(tagPattern)

  if (match) {
    return match[1].toLowerCase()
  }

  return null
}

export function useBookSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SignedBookSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<SearchType>('standard')
  const [taggedProvider, setTaggedProvider] = useState<string | null>(null)

  const searchBooks = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSearchType('standard')
      setTaggedProvider(null)
      setError(null)
      return
    }

    // Detect tagged search locally for immediate UI feedback
    const detectedTag = detectTaggedSearch(searchQuery)
    if (detectedTag) {
      setSearchType('tagged')
      setTaggedProvider(detectedTag === 'hard' ? 'hardcover' : detectedTag)
    } else {
      setSearchType('standard')
      setTaggedProvider(null)
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`)

      if (!response.ok) {
        throw new Error('Failed to search books')
      }

      const data: SearchApiResponse = await response.json()

      // Update search type and provider from API response
      if (data.taggedSearch) {
        setSearchType('tagged')
        setTaggedProvider(data.provider || null)
      } else {
        setSearchType('standard')
        setTaggedProvider(null)
      }

      // Set results
      setResults(data.books || [])

      // Set provider-specific error if present
      if (data.error) {
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchBooks(query)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [query, searchBooks])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    searchBooks,
    searchType,
    taggedProvider
  }
}
