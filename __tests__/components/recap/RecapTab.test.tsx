/**
 * Tests for RecapTab component
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RecapTab } from '@/components/recap/RecapTab'

const mockSession = {
  data: {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: '2025-12-31T23:59:59.999Z',
  },
  status: 'authenticated' as const,
}

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => mockSession),
}))

const mockPreviewResponse = {
  monthName: 'March',
  year: 2026,
  month: 3,
  bookCount: 5,
  completedCount: 4,
  dnfCount: 1,
}

const mockEmptyPreviewResponse = {
  monthName: 'February',
  year: 2026,
  month: 2,
  bookCount: 0,
  completedCount: 0,
  dnfCount: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockPreviewResponse),
  })
})

describe('RecapTab', () => {
  it('renders the heading and selectors', async () => {
    render(<RecapTab />)

    expect(screen.getByText('Monthly Reading Recap')).toBeInTheDocument()
    expect(screen.getByLabelText('Month')).toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
  })

  it('fetches and displays preview data on mount', async () => {
    render(<RecapTab />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })
    expect(screen.getByText(/books finished/)).toBeInTheDocument()
    expect(screen.getByText('4 completed')).toBeInTheDocument()
    expect(screen.getByText('1 DNF')).toBeInTheDocument()
  })

  it('re-fetches preview when month changes', async () => {
    render(<RecapTab />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const monthSelect = screen.getByLabelText('Month')
    fireEvent.change(monthSelect, { target: { value: '1' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('month=1')
      )
    })
  })

  it('disables action buttons when no books', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEmptyPreviewResponse),
    })

    render(<RecapTab />)

    await waitFor(() => {
      expect(screen.getByText('No books finished this month')).toBeInTheDocument()
    })

    expect(screen.getByText('Generate TikTok Video').closest('button')).toBeDisabled()
    expect(screen.getByText('Export JSON Data').closest('button')).toBeDisabled()
  })

  it('enables action buttons when books exist', async () => {
    render(<RecapTab />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    expect(screen.getByText('Generate TikTok Video').closest('button')).not.toBeDisabled()
    expect(screen.getByText('Export JSON Data').closest('button')).not.toBeDisabled()
  })

  it('shows error state when preview fetch fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    })

    render(<RecapTab />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load preview')).toBeInTheDocument()
    })
  })

  it('renders help text', () => {
    render(<RecapTab />)

    expect(
      screen.getByText(/Generate a TikTok-style video/)
    ).toBeInTheDocument()
  })
})
