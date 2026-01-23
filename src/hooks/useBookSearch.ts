import { useState, useEffect, useCallback, useRef } from 'react'
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
  const abortControllerRef = useRef<AbortController | null>(null)

  const searchBooks = useCallback(async (searchQuery: string) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
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

    // Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`, {
        signal: abortController.signal
      })

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
      // Ignore aborted requests - they're expected when a new search starts
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setError(err instanceof Error ? err.message : 'An error occurred')
      setResults([])
    } finally {
      // Only clear loading if this request wasn't aborted
      if (!abortController.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchBooks(query)
    }, 600) // 600ms debounce

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
