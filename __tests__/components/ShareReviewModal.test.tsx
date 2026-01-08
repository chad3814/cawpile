/**
 * Tests for ShareReviewModal component
 * Task Group 3.1: UI component tests
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ShareReviewModal from '@/components/modals/ShareReviewModal'
import { copyToClipboard } from '@/lib/utils/clipboard'

// Mock clipboard utility
jest.mock('@/lib/utils/clipboard', () => ({
  copyToClipboard: jest.fn(),
}))

// Mock next/navigation
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

const mockCopyToClipboard = copyToClipboard as jest.MockedFunction<typeof copyToClipboard>

describe('ShareReviewModal', () => {
  const mockUserBook = {
    id: 'test-book-id',
    bookClubName: 'Test Book Club',
    readathonName: 'Test Readathon',
    edition: {
      title: 'Test Book Title',
      book: {
        title: 'Test Book Title',
        authors: ['Test Author'],
      },
      googleBook: {
        imageUrl: 'https://example.com/cover.jpg',
      },
    },
  }

  const mockExistingShare = {
    id: 'share-id',
    shareToken: 'test-token-123',
    showDates: true,
    showBookClubs: true,
    showReadathons: true,
  }

  beforeAll(() => {
    // Mock window.location once for all tests
    delete (window as any).location
    ;(window as any).location = { origin: 'http://localhost:3000' }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should render modal with privacy toggles', () => {
    render(
      <ShareReviewModal
        isOpen={true}
        onClose={jest.fn()}
        userBook={mockUserBook}
        existingShare={null}
      />
    )

    expect(screen.getByText('Share Your Review')).toBeInTheDocument()
    expect(screen.getByLabelText(/show reading dates/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/show book clubs/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/show readathons/i)).toBeInTheDocument()
  })

  test('should disable book club toggle when bookClubName is not set', () => {
    const userBookWithoutClub = {
      ...mockUserBook,
      bookClubName: null,
    }

    render(
      <ShareReviewModal
        isOpen={true}
        onClose={jest.fn()}
        userBook={userBookWithoutClub}
        existingShare={null}
      />
    )

    const bookClubCheckbox = screen.getByLabelText(/show book clubs/i)
    expect(bookClubCheckbox).toBeDisabled()
    expect(screen.getByText(/\(not set\)/i)).toBeInTheDocument()
  })

  test('should display share URL and copy button when share exists', () => {
    render(
      <ShareReviewModal
        isOpen={true}
        onClose={jest.fn()}
        userBook={mockUserBook}
        existingShare={mockExistingShare}
      />
    )

    const expectedUrl = `http://localhost:3000/share/reviews/${mockExistingShare.shareToken}`

    // Modal uses Headless UI portals, so we need to query by role or text
    expect(screen.getByText('Update Share Settings')).toBeInTheDocument()
    expect(screen.getByText('Share Link')).toBeInTheDocument()

    const urlInput = screen.getByDisplayValue(expectedUrl) as HTMLInputElement
    expect(urlInput).toBeInTheDocument()
    expect(urlInput.readOnly).toBe(true)
  })

  test('should copy share URL to clipboard when copy button is clicked', async () => {
    mockCopyToClipboard.mockResolvedValue(true)

    render(
      <ShareReviewModal
        isOpen={true}
        onClose={jest.fn()}
        userBook={mockUserBook}
        existingShare={mockExistingShare}
      />
    )

    // Find copy button by accessible role and visible icon
    const copyButtons = screen.getAllByRole('button')
    const copyButton = copyButtons.find(btn => btn.getAttribute('title') === 'Copy to clipboard')

    expect(copyButton).toBeDefined()
    fireEvent.click(copyButton!)

    await waitFor(() => {
      expect(mockCopyToClipboard).toHaveBeenCalledWith(
        `http://localhost:3000/share/reviews/${mockExistingShare.shareToken}`
      )
    })

    await waitFor(() => {
      expect(screen.getByText(/link copied to clipboard/i)).toBeInTheDocument()
    })
  })

  test('should create new share when Create Share Link button is clicked', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        shareUrl: 'http://localhost:3000/share/reviews/new-token',
        shareToken: 'new-token',
        sharedReview: mockExistingShare,
      }),
    } as Response)

    mockCopyToClipboard.mockResolvedValue(true)

    render(
      <ShareReviewModal
        isOpen={true}
        onClose={jest.fn()}
        userBook={mockUserBook}
        existingShare={null}
      />
    )

    const createButton = screen.getByText('Create Share Link')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/user/books/${mockUserBook.id}/share`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            showDates: true,
            showBookClubs: true,
            showReadathons: true,
          }),
        })
      )
    })

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  test('should update privacy settings when Update Settings button is clicked', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)

    const mockOnClose = jest.fn()

    render(
      <ShareReviewModal
        isOpen={true}
        onClose={mockOnClose}
        userBook={mockUserBook}
        existingShare={mockExistingShare}
      />
    )

    // Toggle privacy setting
    const datesCheckbox = screen.getByLabelText(/show reading dates/i)
    fireEvent.click(datesCheckbox)

    const updateButton = screen.getByText('Update Settings')
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/user/books/${mockUserBook.id}/share`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            showDates: false,
            showBookClubs: true,
            showReadathons: true,
          }),
        })
      )
    })

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  test('should delete share when Delete Share button is clicked and confirmed', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockResolvedValue({
      ok: true,
    } as Response)

    global.confirm = jest.fn(() => true)
    const mockOnClose = jest.fn()

    render(
      <ShareReviewModal
        isOpen={true}
        onClose={mockOnClose}
        userBook={mockUserBook}
        existingShare={mockExistingShare}
      />
    )

    const deleteButton = screen.getByText('Delete Share')
    fireEvent.click(deleteButton)

    expect(global.confirm).toHaveBeenCalled()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/user/books/${mockUserBook.id}/share`,
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
