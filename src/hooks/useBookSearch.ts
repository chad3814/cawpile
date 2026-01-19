import { useState, useEffect, useCallback } from 'react'
import type { SignedBookSearchResult } from '@/lib/search/types'

export function useBookSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SignedBookSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchBooks = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery)}`)
      
      if (!response.ok) {
        throw new Error('Failed to search books')
      }

      const data = await response.json()
      setResults(data.books || [])
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
    searchBooks
  }
}