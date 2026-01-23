/**
 * Tests for DataPrivacySection component.
 * Task Group 3.1: Tests for DataPrivacySection component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DataPrivacySection from '@/components/settings/DataPrivacySection'

// Mock the downloadExport function
jest.mock('@/lib/export/downloadExport', () => ({
  downloadExport: jest.fn(),
}))

import { downloadExport } from '@/lib/export/downloadExport'

const mockDownloadExport = downloadExport as jest.MockedFunction<typeof downloadExport>

describe('DataPrivacySection', () => {
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockDownloadExport.mockResolvedValue(undefined)
  })

  test('renders section title, description, and both download buttons', () => {
    render(<DataPrivacySection onError={mockOnError} />)

    // Check for section title
    expect(screen.getByText('Data & Privacy')).toBeInTheDocument()

    // Check for subtitle
    expect(screen.getByText('Your data belongs to you')).toBeInTheDocument()

    // Check for description text
    expect(screen.getByText(/Download a complete backup/)).toBeInTheDocument()

    // Check for both download buttons
    expect(screen.getByRole('button', { name: /Download as JSON/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download as CSV/i })).toBeInTheDocument()
  })

  test('clicking JSON button triggers fetch and shows loading state', async () => {
    // Make downloadExport take some time so we can check loading state
    mockDownloadExport.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<DataPrivacySection onError={mockOnError} />)

    const jsonButton = screen.getByRole('button', { name: /Download as JSON/i })

    fireEvent.click(jsonButton)

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeInTheDocument()
    })

    // Verify downloadExport was called with 'json'
    expect(mockDownloadExport).toHaveBeenCalledWith('json')

    // Wait for completion
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /Download as JSON/i })).toBeInTheDocument()
      },
      { timeout: 500 }
    )
  })

  test('clicking CSV button triggers fetch', async () => {
    render(<DataPrivacySection onError={mockOnError} />)

    const csvButton = screen.getByRole('button', { name: /Download as CSV/i })

    fireEvent.click(csvButton)

    // Verify downloadExport was called with 'csv'
    await waitFor(() => {
      expect(mockDownloadExport).toHaveBeenCalledWith('csv')
    })
  })

  test('error handling displays toast via onError callback', async () => {
    const errorMessage = 'Failed to export data'
    mockDownloadExport.mockRejectedValue(new Error(errorMessage))

    render(<DataPrivacySection onError={mockOnError} />)

    const jsonButton = screen.getByRole('button', { name: /Download as JSON/i })

    fireEvent.click(jsonButton)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(errorMessage)
    })
  })

  test('both buttons are disabled during export', async () => {
    mockDownloadExport.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200))
    )

    render(<DataPrivacySection onError={mockOnError} />)

    const jsonButton = screen.getByRole('button', { name: /Download as JSON/i })
    const csvButton = screen.getByRole('button', { name: /Download as CSV/i })

    // Both buttons should be enabled initially
    expect(jsonButton).not.toBeDisabled()
    expect(csvButton).not.toBeDisabled()

    // Click JSON button
    fireEvent.click(jsonButton)

    // Both buttons should be disabled during export
    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })

    // Wait for export to complete
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /Download as JSON/i })).not.toBeDisabled()
      },
      { timeout: 500 }
    )
  })
})
