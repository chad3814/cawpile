/**
 * Tests for useBookSearch hook tagged search functionality
 * Task Group 6.1: Hook tests for tagged search detection
 */
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBookSearch } from '@/hooks/useBookSearch'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useBookSearch hook tagged search functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('should detect tagged search and set searchType to "tagged"', async () => {
    const mockResponse = {
      books: [{ id: '1', title: 'Test Book', authors: [], categories: [], sources: [] }],
      taggedSearch: true,
      provider: 'ibdb'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const { result } = renderHook(() => useBookSearch())

    act(() => {
      result.current.setQuery('ibdb:test-uuid')
    })

    // Fast-forward debounce timer (600ms)
    act(() => {
      jest.advanceTimersByTime(600)
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.searchType).toBe('tagged')
    expect(result.current.taggedProvider).toBe('ibdb')
  })

  test('should extract taggedProvider from query (e.g., "ibdb" from "ibdb:123")', async () => {
    const mockResponse = {
      books: [],
      taggedSearch: true,
      provider: 'hardcover',
      error: 'Book not found'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const { result } = renderHook(() => useBookSearch())

    act(() => {
      result.current.setQuery('hard:12345')
    })

    // Fast-forward debounce timer (600ms)
    act(() => {
      jest.advanceTimersByTime(600)
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.taggedProvider).toBe('hardcover')
  })

  test('should set searchType to "standard" for regular queries', async () => {
    const mockResponse = {
      books: [{ id: '1', title: 'Test Book', authors: [], categories: [], sources: [] }],
      taggedSearch: false
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const { result } = renderHook(() => useBookSearch())

    act(() => {
      result.current.setQuery('lord of the rings')
    })

    // Fast-forward debounce timer (600ms)
    act(() => {
      jest.advanceTimersByTime(600)
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.searchType).toBe('standard')
    expect(result.current.taggedProvider).toBeNull()
  })

  test('should pass provider-specific error from API response', async () => {
    const mockResponse = {
      books: [],
      taggedSearch: true,
      provider: 'ibdb',
      error: 'Book not found with ID test-uuid on IBDb'
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })

    const { result } = renderHook(() => useBookSearch())

    act(() => {
      result.current.setQuery('ibdb:test-uuid')
    })

    // Fast-forward debounce timer (600ms)
    act(() => {
      jest.advanceTimersByTime(600)
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Book not found with ID test-uuid on IBDb')
    expect(result.current.searchType).toBe('tagged')
  })
})
