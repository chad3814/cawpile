import { useState, useEffect } from 'react'

interface BookClub {
  name: string
  lastUsed: string
  usageCount: number
}

export function useBookClubs(query: string = '') {
  const [clubs, setClubs] = useState<BookClub[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query) {
      setClubs([])
      return
    }

    const fetchClubs = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/user/book-clubs?q=${encodeURIComponent(query)}`)
        if (!response.ok) {
          throw new Error('Failed to fetch book clubs')
        }

        const data = await response.json()
        setClubs(data.bookClubs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setClubs([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchClubs, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  return { clubs, loading, error }
}