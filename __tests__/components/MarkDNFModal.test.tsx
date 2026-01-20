/**
 * Tests for MarkDNFModal date handling
 * Task Group 4.1: MarkDNFModal tests
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import MarkDNFModal from '@/components/modals/MarkDNFModal'

describe('MarkDNFModal', () => {
  const mockBook = {
    id: 'test-book-id',
    title: 'Test Book Title',
    startDate: new Date('2024-01-15'),
  }

  const mockOnClose = jest.fn()
  const mockOnDNF = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('date picker should render with label', async () => {
    await act(async () => {
      render(
        <MarkDNFModal
          isOpen={true}
          onClose={mockOnClose}
          book={mockBook}
          onDNF={mockOnDNF}
        />
      )
    })

    // Check that date picker exists with label
    expect(screen.getByText('When did you stop reading?')).toBeInTheDocument()

    // Check that the date input exists
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    expect(dateInput).toBeInTheDocument()
  })

  test('onDNF callback should receive reason and finishDate', async () => {
    await act(async () => {
      render(
        <MarkDNFModal
          isOpen={true}
          onClose={mockOnClose}
          book={mockBook}
          onDNF={mockOnDNF}
        />
      )
    })

    // Fill in DNF reason
    const reasonTextarea = screen.getByPlaceholderText('Share your reason for not finishing...')
    await act(async () => {
      fireEvent.change(reasonTextarea, { target: { value: 'Writing style was not for me' } })
    })

    // Set a specific date
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(dateInput, { target: { value: '2024-03-15' } })
    })

    // Click the submit button
    const submitButton = screen.getByRole('button', { name: /Mark as DNF/i })
    await act(async () => {
      fireEvent.click(submitButton)
    })

    // Wait for the async callback
    await waitFor(() => {
      expect(mockOnDNF).toHaveBeenCalledTimes(1)
      expect(mockOnDNF).toHaveBeenCalledWith(
        'test-book-id',
        'Writing style was not for me',
        '2024-03-15'
      )
    })
  })
})
