/**
 * Tests for DeleteBookModal component
 * Task Group 4.1: DeleteBookModal tests
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DeleteBookModal from '@/components/admin/DeleteBookModal'

describe('DeleteBookModal', () => {
  const mockOnClose = jest.fn()
  const mockOnConfirm = jest.fn()

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    bookTitle: 'Test Book Title',
    bookId: 'test-book-id',
    onConfirm: mockOnConfirm,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnConfirm.mockResolvedValue(undefined)
  })

  test('renders modal with book title in confirmation message', () => {
    render(<DeleteBookModal {...defaultProps} />)

    expect(screen.getByText('Delete Book')).toBeInTheDocument()
    expect(screen.getByText(/Test Book Title/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  test('Cancel button closes modal without calling onConfirm', () => {
    render(<DeleteBookModal {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
    expect(mockOnConfirm).not.toHaveBeenCalled()
  })

  test('Delete button calls onConfirm and shows loading state', async () => {
    // Make onConfirm take some time to simulate loading
    mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<DeleteBookModal {...defaultProps} />)

    const deleteButton = screen.getByRole('button', { name: /^delete$/i })
    fireEvent.click(deleteButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/deleting/i)).toBeInTheDocument()
    })

    // Should have called onConfirm
    expect(mockOnConfirm).toHaveBeenCalledTimes(1)
  })

  test('does not render when isOpen is false', () => {
    render(<DeleteBookModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Delete Book')).not.toBeInTheDocument()
  })
})
