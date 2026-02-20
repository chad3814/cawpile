import { useState, useEffect } from 'react'

interface Readathon {
  name: string
  lastUsed: string
  usageCount: number
}

export function useReadathons(query: string = '') {
  const [readathons, setReadathons] = useState<Readathon[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query) {
      setReadathons([])
      return
    }

    const fetchReadathons = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/user/readathons?q=${encodeURIComponent(query)}`)
        if (!response.ok) {
          throw new Error('Failed to fetch readathons')
        }

        const data = await response.json()
        setReadathons(data.readathons || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setReadathons([])
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchReadathons, 300)
    return () => clearTimeout(debounceTimer)
  }, [query])

  return { readathons, loading, error }
}