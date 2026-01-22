/**
 * Tests for PreferencesSection component
 * Task Group 6.1: Tests for PreferencesSection toggles
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PreferencesSection from '@/components/settings/PreferencesSection'

// Mock fetch
global.fetch = jest.fn()

describe('PreferencesSection', () => {
  const defaultProps = {
    data: {
      readingGoal: 12,
      showCurrentlyReading: false,
      profileEnabled: true,
      showTbr: false,
      username: 'testuser'
    },
    onUpdate: jest.fn(),
    onSuccess: jest.fn(),
    onError: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        readingGoal: 12,
        showCurrentlyReading: false,
        profileEnabled: true,
        showTbr: false
      })
    })
  })

  test('should render "Enable public profile" toggle', () => {
    render(<PreferencesSection {...defaultProps} />)

    // Check for the label text (using getAllBy since there are duplicate elements due to sr-only spans)
    const profileLabels = screen.getAllByText(/Enable public profile page/i)
    expect(profileLabels.length).toBeGreaterThan(0)
    // Check for SharedReviews note in description
    expect(screen.getByText(/SharedReviews will continue to work/i)).toBeInTheDocument()
  })

  test('should render "Show TBR" toggle', () => {
    render(<PreferencesSection {...defaultProps} />)

    // Using getAllBy since there may be multiple matching elements (label and sr-only span)
    const tbrLabels = screen.getAllByText(/Show my TBR books publicly/i)
    expect(tbrLabels.length).toBeGreaterThan(0)
    expect(screen.getByText(/want-to-read list will be visible/i)).toBeInTheDocument()
  })

  test('should include profileEnabled and showTbr in PATCH request', async () => {
    render(<PreferencesSection {...defaultProps} />)

    // Find and click the submit button
    const submitButton = screen.getByRole('button', { name: /Save Preferences/i })
    fireEvent.click(submitButton)

    // Wait for fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
    const requestBody = fetchCall[1].body

    expect(requestBody).toContain('profileEnabled')
    expect(requestBody).toContain('showTbr')
  })

  test('should show profile link in description when username is available', () => {
    render(<PreferencesSection {...defaultProps} />)

    // Look for the link with the URL text
    const profileLink = screen.getByText('/u/testuser')
    expect(profileLink).toBeInTheDocument()
    expect(profileLink).toHaveAttribute('href', '/u/testuser')
  })
})
