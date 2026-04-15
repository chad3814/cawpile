/**
 * Tests for ShareReviewModal component
 * Task Group 3.1: UI component tests
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fill, unoptimized, ...rest } = props
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...rest} data-unoptimized={unoptimized ? 'true' : 'false'} />
  },
}))

// Mock html-to-image (used on non-Safari browsers)
jest.mock('html-to-image', () => ({
  toPng: jest.fn(() => Promise.resolve('data:image/png;base64,mock-image-data')),
}))

// Mock html2canvas (Safari fallback)
jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,mock-image-data'
  }))
}))

// Mock download and truncate functions used by ShareReviewModal
jest.mock('@/lib/image/generateReviewImage', () => ({
  downloadImage: jest.fn(),
  generateImageFilename: jest.fn((title: string) => `cawpile-review-${title.toLowerCase()}.png`),
  truncateReviewText: jest.fn((text: string | null | undefined) => text || ''),
  slugifyBookTitle: jest.fn((title: string) => title.toLowerCase().replace(/\s+/g, '-')),
  imageUrlToDataUrl: jest.fn(() => Promise.resolve('data:image/png;base64,mock-cover-data')),
}))

// Mock imageTheme
jest.mock('@/lib/image/imageTheme', () => ({
  IMAGE_WIDTH: 1080,
  IMAGE_HEIGHT: 1920,
  BG_COLOR: '#0f172a',
  TEXT_COLOR: '#ffffff',
  TEXT_MUTED_COLOR: '#94a3b8',
  ACCENT_COLOR: '#f97316',
  BORDER_COLOR: '#334155',
  SCORE_COLORS: {
    excellent: '#22c55e',
    good: '#eab308',
    average: '#f97316',
    poor: '#ef4444',
  },
  getScoreColor: jest.fn(() => '#22c55e'),
  TYPOGRAPHY: {
    title: { fontSize: 48, fontWeight: 700, lineHeight: 1.2 },
    author: { fontSize: 28, fontWeight: 400, lineHeight: 1.4 },
    facetName: { fontSize: 22, fontWeight: 500, lineHeight: 1.3 },
    facetScore: { fontSize: 26, fontWeight: 700, lineHeight: 1 },
    average: { fontSize: 56, fontWeight: 700, lineHeight: 1 },
    stars: { fontSize: 32, lineHeight: 1 },
    review: { fontSize: 24, fontWeight: 400, lineHeight: 1.6 },
    metadata: { fontSize: 20, fontWeight: 400, lineHeight: 1.4 },
    branding: { fontSize: 18, fontWeight: 500, lineHeight: 1 },
  },
  SPACING: { padding: 48, sectionGap: 32, itemGap: 16, smallGap: 8 },
  COVER_SIZE: { width: 280, height: 420 },
  MAX_REVIEW_CHARS: 500,
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
        bookType: 'FICTION' as const,
      },
      googleBook: {
        imageUrl: 'https://example.com/cover.jpg',
      },
    },
  }

  const mockUserBookWithRating = {
    ...mockUserBook,
    review: 'This is a great book!',
    startDate: new Date('2024-01-01'),
    finishDate: new Date('2024-01-15'),
    cawpileRating: {
      id: 'rating-id',
      average: 8.5,
      characters: 9,
      atmosphere: 8,
      writing: 9,
      plot: 8,
      intrigue: 8,
      logic: 7,
      enjoyment: 9,
    },
  }

  const mockExistingShare = {
    id: 'share-id',
    shareToken: 'test-token-123',
    showDates: true,
    showBookClubs: true,
    showReadathons: true,
    showReview: true,
  }

  // window.location.origin is set to 'http://localhost:3000' via jest.config.ts testEnvironmentOptions

  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should render modal with privacy toggles', async () => {
    await act(async () => {
      render(
        <ShareReviewModal
          isOpen={true}
          onClose={jest.fn()}
          userBook={mockUserBook}
          existingShare={null}
          setShareData={jest.fn()}
        />
      )
    })

    expect(screen.getByText('Share Your Review')).toBeInTheDocument()
    expect(screen.getByLabelText(/show reading dates/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/show book clubs/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/show readathons/i)).toBeInTheDocument()
  })

  test('should disable book club toggle when bookClubName is not set', async () => {
    const userBookWithoutClub = {
      ...mockUserBook,
      bookClubName: null,
    }

    await act(async () => {
      render(
        <ShareReviewModal
          isOpen={true}
          onClose={jest.fn()}
          userBook={userBookWithoutClub}
          existingShare={null}
          setShareData={jest.fn()}
        />
      )
    })

    const bookClubCheckbox = screen.getByLabelText(/show book clubs/i)
    expect(bookClubCheckbox).toBeDisabled()
    expect(screen.getByText(/\(not set\)/i)).toBeInTheDocument()
  })

  test('should display share URL and copy button when share exists', async () => {
    await act(async () => {
      render(
        <ShareReviewModal
          isOpen={true}
          onClose={jest.fn()}
          userBook={mockUserBook}
          existingShare={mockExistingShare}
          setShareData={jest.fn()}
        />
      )
    })

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

    await act(async () => {
      render(
        <ShareReviewModal
          isOpen={true}
          onClose={jest.fn()}
          userBook={mockUserBook}
          existingShare={mockExistingShare}
          setShareData={jest.fn()}
        />
      )
    })

    // Find copy button by accessible role and visible icon
    const copyButtons = screen.getAllByRole('button')
    const copyButton = copyButtons.find(btn => btn.getAttribute('title') === 'Copy to clipboard')

    expect(copyButton).toBeDefined()
    await act(async () => {
      fireEvent.click(copyButton!)
    })

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

    await act(async () => {
      render(
        <ShareReviewModal
          isOpen={true}
          onClose={jest.fn()}
          userBook={mockUserBook}
          existingShare={null}
          setShareData={jest.fn()}
        />
      )
    })

    const createButton = screen.getByText('Create Share Link')
    await act(async () => {
      fireEvent.click(createButton)
    })

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
            showReview: true,
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

    await act(async () => {
      render(
        <ShareReviewModal
          isOpen={true}
          onClose={mockOnClose}
          userBook={mockUserBook}
          existingShare={mockExistingShare}
          setShareData={jest.fn()}
        />
      )
    })

    // Toggle privacy setting
    const datesCheckbox = screen.getByLabelText(/show reading dates/i)
    await act(async () => {
      fireEvent.click(datesCheckbox)
    })

    const updateButton = screen.getByText('Update Settings')
    await act(async () => {
      fireEvent.click(updateButton)
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/user/books/${mockUserBook.id}/share`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            showDates: false,
            showBookClubs: true,
            showReadathons: true,
            showReview: true,
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

    await act(async () => {
      render(
        <ShareReviewModal
          isOpen={true}
          onClose={mockOnClose}
          userBook={mockUserBook}
          existingShare={mockExistingShare}
          setShareData={jest.fn()}
        />
      )
    })

    const deleteButton = screen.getByText('Delete Share')
    await act(async () => {
      fireEvent.click(deleteButton)
    })

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

  // Image Generation Tests
  describe('Image Generation', () => {
    test('should show Generate Image button when book has CAWPILE rating', async () => {
      await act(async () => {
        render(
          <ShareReviewModal
            isOpen={true}
            onClose={jest.fn()}
            userBook={mockUserBookWithRating}
            existingShare={null}
            setShareData={jest.fn()}
          />
        )
      })

      expect(screen.getByText('Generate Image for Social Media')).toBeInTheDocument()
      expect(screen.getByText(/Create a 1080x1920 image/i)).toBeInTheDocument()
    })

    test('should not show Generate Image button when book has no CAWPILE rating', async () => {
      await act(async () => {
        render(
          <ShareReviewModal
            isOpen={true}
            onClose={jest.fn()}
            userBook={mockUserBook}
            existingShare={null}
            setShareData={jest.fn()}
          />
        )
      })

      expect(screen.queryByText('Generate Image for Social Media')).not.toBeInTheDocument()
    })

    test('should show image preview after clicking Generate Image', async () => {
      await act(async () => {
        render(
          <ShareReviewModal
            isOpen={true}
            onClose={jest.fn()}
            userBook={mockUserBookWithRating}
            existingShare={null}
            setShareData={jest.fn()}
          />
        )
      })

      const generateButton = screen.getByText('Generate Image for Social Media')
      await act(async () => {
        fireEvent.click(generateButton)
      })

      // Wait for image generation to complete
      await waitFor(() => {
        expect(screen.getByText('Image Preview')).toBeInTheDocument()
      })

      // Should show Back and Download buttons
      expect(screen.getByText('Back')).toBeInTheDocument()
      expect(screen.getByText('Download')).toBeInTheDocument()
    })

    test('should return to main view when Back button is clicked in preview', async () => {
      await act(async () => {
        render(
          <ShareReviewModal
            isOpen={true}
            onClose={jest.fn()}
            userBook={mockUserBookWithRating}
            existingShare={null}
            setShareData={jest.fn()}
          />
        )
      })

      // Generate image
      const generateButton = screen.getByText('Generate Image for Social Media')
      await act(async () => {
        fireEvent.click(generateButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Image Preview')).toBeInTheDocument()
      })

      // Click back
      const backButton = screen.getByText('Back')
      await act(async () => {
        fireEvent.click(backButton)
      })

      // Should return to main view
      await waitFor(() => {
        expect(screen.getByText('Share Your Review')).toBeInTheDocument()
      })
    })
  })
})
