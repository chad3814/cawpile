/**
 * Tests for ReviewImageTemplate component
 * Task Group 2.1: Component rendering tests
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ReviewImageTemplate from '@/components/share/ReviewImageTemplate'
import { BookType } from '@/types/cawpile'

describe('ReviewImageTemplate', () => {
  const mockBook = {
    title: 'The Great Gatsby',
    authors: ['F. Scott Fitzgerald'],
    coverUrl: 'https://example.com/cover.jpg',
    bookType: BookType.FICTION,
  }

  const mockRating = {
    average: 8.5,
    characters: 9,
    atmosphere: 8,
    writing: 9,
    plot: 8,
    intrigue: 8,
    logic: 7,
    enjoyment: 9,
  }

  const mockPrivacySettings = {
    showDates: true,
    showBookClubs: true,
    showReadathons: true,
  }

  const mockMetadata = {
    startDate: new Date('2024-01-01'),
    finishDate: new Date('2024-01-15'),
    bookClubName: 'Classic Lit Club',
    readathonName: 'Winter Reading Challenge',
  }

  test('should render with complete book data', () => {
    render(
      <ReviewImageTemplate
        book={mockBook}
        rating={mockRating}
        review="An incredible classic that captures the essence of the Jazz Age."
        privacySettings={mockPrivacySettings}
        metadata={mockMetadata}
      />
    )

    // Book info
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
    expect(screen.getByText('F. Scott Fitzgerald')).toBeInTheDocument()

    // Rating - average is now in format "(8.5/10)" split across elements
    expect(screen.getByText(/8\.5/)).toBeInTheDocument()
    expect(screen.getByText('CAWPILE Rating')).toBeInTheDocument()

    // Review
    expect(screen.getByText('Review')).toBeInTheDocument()
    expect(screen.getByText(/incredible classic/)).toBeInTheDocument()

    // Branding - now split into separate elements
    expect(screen.getByText(/Powered by/)).toBeInTheDocument()
    expect(screen.getByText('Cawpile')).toBeInTheDocument()
  })

  test('should handle missing book cover gracefully', () => {
    const bookWithoutCover = {
      ...mockBook,
      coverUrl: null,
    }

    render(
      <ReviewImageTemplate
        book={bookWithoutCover}
        rating={mockRating}
        review="Great book!"
        privacySettings={mockPrivacySettings}
      />
    )

    expect(screen.getByText('No Cover Available')).toBeInTheDocument()
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
  })

  test('should respect privacy settings for metadata', () => {
    const restrictedPrivacy = {
      showDates: false,
      showBookClubs: false,
      showReadathons: false,
    }

    render(
      <ReviewImageTemplate
        book={mockBook}
        rating={mockRating}
        review="Great read!"
        privacySettings={restrictedPrivacy}
        metadata={mockMetadata}
      />
    )

    // Metadata should not be visible
    expect(screen.queryByText('Classic Lit Club')).not.toBeInTheDocument()
    expect(screen.queryByText('Winter Reading Challenge')).not.toBeInTheDocument()
    // Book info should still be visible
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
  })

  test('should show metadata when privacy settings allow', () => {
    render(
      <ReviewImageTemplate
        book={mockBook}
        rating={mockRating}
        review="Loved it!"
        privacySettings={mockPrivacySettings}
        metadata={mockMetadata}
      />
    )

    expect(screen.getByText('Classic Lit Club')).toBeInTheDocument()
    expect(screen.getByText('Winter Reading Challenge')).toBeInTheDocument()
  })

  test('should handle empty review gracefully', () => {
    render(
      <ReviewImageTemplate
        book={mockBook}
        rating={mockRating}
        review={null}
        privacySettings={mockPrivacySettings}
      />
    )

    // Should not show Review section
    expect(screen.queryByText('Review')).not.toBeInTheDocument()
    // Other content should still render
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
    expect(screen.getByText(/8\.5/)).toBeInTheDocument()
  })

  test('should display all 7 CAWPILE facets for fiction', () => {
    render(
      <ReviewImageTemplate
        book={mockBook}
        rating={mockRating}
        review="Good book"
        privacySettings={mockPrivacySettings}
      />
    )

    // Fiction facets
    expect(screen.getByText('Characters')).toBeInTheDocument()
    expect(screen.getByText('Atmosphere')).toBeInTheDocument()
    expect(screen.getByText('Writing')).toBeInTheDocument()
    expect(screen.getByText('Plot')).toBeInTheDocument()
    expect(screen.getByText('Intrigue')).toBeInTheDocument()
    expect(screen.getByText('Logic')).toBeInTheDocument()
    expect(screen.getByText('Enjoyment')).toBeInTheDocument()
  })

  test('should display non-fiction facets for non-fiction books', () => {
    const nonfictionBook = {
      ...mockBook,
      bookType: BookType.NONFICTION,
    }

    render(
      <ReviewImageTemplate
        book={nonfictionBook}
        rating={mockRating}
        review="Informative read"
        privacySettings={mockPrivacySettings}
      />
    )

    // Non-fiction facets (first part before '/')
    expect(screen.getByText('Credibility')).toBeInTheDocument()
    expect(screen.getByText('Authenticity')).toBeInTheDocument()
    expect(screen.getByText('Personal Impact')).toBeInTheDocument()
  })

  test('should use crossOrigin attribute on img for html2canvas compatibility', () => {
    render(
      <ReviewImageTemplate
        book={mockBook}
        rating={mockRating}
        review="Test"
        privacySettings={mockPrivacySettings}
      />
    )

    const img = screen.getByAltText('The Great Gatsby')
    expect(img).toHaveAttribute('crossOrigin', 'anonymous')
  })
})
