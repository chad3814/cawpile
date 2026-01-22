/**
 * Tests for DeleteUserModal component
 * Task Group 5.1: DeleteUserModal tests
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DeleteUserModal from '@/components/admin/DeleteUserModal'

// Mock fetch
global.fetch = jest.fn()

describe('DeleteUserModal', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    userId: 'test-user-id',
    userEmail: 'test@example.com',
    onConfirm: mockOnConfirm,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnConfirm.mockResolvedValue(undefined)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ booksCount: 5, sharedReviewsCount: 2 }),
    })
  })

  test('fetches and displays user stats when modal opens', async () => {
    render(<DeleteUserModal {...defaultProps} />)

    // Should show loading state initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // Should fetch user stats
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/test-user-id/stats')
    })

    // Should display stats after loading
    await waitFor(() => {
      expect(screen.getByText(/5 books tracked/i)).toBeInTheDocument()
      expect(screen.getByText(/2 shared reviews/i)).toBeInTheDocument()
    })
  })

  test('Cancel button closes modal without calling onConfirm', async () => {
    render(<DeleteUserModal {...defaultProps} />)

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockOnConfirm).not.toHaveBeenCalled()
  })

  test('Delete button calls onConfirm and shows loading state', async () => {
    // Make onConfirm take some time to simulate loading
    mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<DeleteUserModal {...defaultProps} />)

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /^delete$/i })
    fireEvent.click(deleteButton)

    // Should show loading state on delete button
    await waitFor(() => {
      expect(screen.getByText(/deleting/i)).toBeInTheDocument()
    })

    // Should have called onConfirm
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  test('does not render when isOpen is false', () => {
    render(<DeleteUserModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Delete User')).not.toBeInTheDocument()
  })

  test('displays user email in confirmation message', async () => {
    render(<DeleteUserModal {...defaultProps} />)

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })

    expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
  })
})
