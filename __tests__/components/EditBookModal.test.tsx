/**
 * Tests for EditBookModal DNF date editing
 * Task Group 6.1: EditBookModal tests
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import EditBookModal from '@/components/modals/EditBookModal'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock

describe('EditBookModal DNF Date Editing', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock Date.now() to return a consistent date for testing
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-03-20'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('DNF date picker appears for DNF status books', async () => {
    const mockBook = {
      id: 'test-book-id',
      title: 'Test Book Title',
      status: 'DNF' as const,
      format: ['PAPERBACK'] as ['PAPERBACK'],
      finishDate: new Date('2024-02-15'),
      dnfReason: 'Too slow',
    }

    await act(async () => {
      render(
        <EditBookModal
          isOpen={true}
          onClose={mockOnClose}
          book={mockBook}
        />
      )
    })

    // Check that DNF date picker exists
    expect(screen.getByText('When did you stop reading?')).toBeInTheDocument()

    // Check that the date input exists and has the correct value
    const dnfDateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    expect(dnfDateInput).toBeInTheDocument()
    expect(dnfDateInput).toHaveValue('2024-02-15')
  })

  test('updating DNF date sends finishDate in PATCH request', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userBook: { id: 'test-id' } }),
    })
    global.fetch = mockFetch

    const mockBook = {
      id: 'test-book-id',
      title: 'Test Book Title',
      status: 'DNF' as const,
      format: ['PAPERBACK'] as ['PAPERBACK'],
      finishDate: new Date('2024-02-15'),
      dnfReason: 'Too slow',
    }

    await act(async () => {
      render(
        <EditBookModal
          isOpen={true}
          onClose={mockOnClose}
          book={mockBook}
        />
      )
    })

    // Change the DNF date
    const dnfDateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(dnfDateInput, { target: { value: '2024-03-10' } })
    })

    // Submit the form
    const saveButton = screen.getByRole('button', { name: /Save Changes/i })
    await act(async () => {
      fireEvent.click(saveButton)
    })

    // Wait for fetch to be called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/user/books/test-book-id',
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })

    // Parse the body to check finishDate
    const calls = mockFetch.mock.calls
    const patchCall = calls.find((call: [string, RequestInit]) => call[0].includes('/api/user/books/'))
    if (patchCall) {
      const body = JSON.parse(patchCall[1].body as string)
      expect(body.finishDate).toBe('2024-03-10')
    }
  })
})
