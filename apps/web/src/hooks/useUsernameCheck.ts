import { useState, useEffect } from 'react'
import { useDebounce } from './useDebounce'

interface UsernameCheckResult {
  isChecking: boolean
  isAvailable: boolean | null
  message: string | null
  error: string | null
}

/**
 * Hook to check username availability with debouncing
 * Skips check if username is unchanged from current
 *
 * @param username - The username to check
 * @param currentUsername - The user's current username (to skip unnecessary checks)
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 */
export function useUsernameCheck(
  username: string,
  currentUsername: string | null,
  debounceMs = 300
): UsernameCheckResult {
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const debouncedUsername = useDebounce(username, debounceMs)

  useEffect(() => {
    // Reset state if username is empty
    if (!debouncedUsername.trim()) {
      setIsAvailable(null)
      setMessage(null)
      setError(null)
      return
    }

    // Skip check if username is the same as current (case-insensitive)
    if (
      currentUsername &&
      debouncedUsername.toLowerCase() === currentUsername.toLowerCase()
    ) {
      setIsAvailable(true)
      setMessage('This is your current username')
      setError(null)
      return
    }

    const checkUsername = async () => {
      setIsChecking(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/user/username-check?username=${encodeURIComponent(debouncedUsername)}`
        )

        if (!response.ok) {
          throw new Error('Failed to check username')
        }

        const data = await response.json()

        setIsAvailable(data.available)
        setMessage(data.message || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setIsAvailable(null)
        setMessage(null)
      } finally {
        setIsChecking(false)
      }
    }

    checkUsername()
  }, [debouncedUsername, currentUsername])

  return {
    isChecking,
    isAvailable,
    message,
    error,
  }
}
