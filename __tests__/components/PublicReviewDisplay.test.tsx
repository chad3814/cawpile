/**
 * Tests for PublicReviewDisplay component
 * Task Group 4.1: Public page tests
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PublicReviewDisplay from '@/components/share/PublicReviewDisplay'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

describe('PublicReviewDisplay', () => {
  const mockSharedReview = {
    id: 'share-id',
    showDates: true,
    showBookClubs: true,
    showReadathons: true,
    showReview: true,
    userBook: {
      startDate: new Date('2024-01-01'),
      finishDate: new Date('2024-01-15'),
      bookClubName: 'Test Book Club',
      readathonName: 'Test Readathon',
      review: 'This is a test review of the book.',
      preferredCoverProvider: null,
      edition: {
        title: 'Test Book Title',
        book: {
          title: 'Test Book Title',
          authors: ['Test Author', 'Co-Author'],
          bookType: 'FICTION' as const,
        },
        googleBook: {
          imageUrl: 'https://example.com/cover.jpg',
          description: 'A great test book',
        },
        hardcoverBook: null,
        ibdbBook: null,
      },
      cawpileRating: {
        id: 'rating-id',
        average: 8.5,
        characters: 9,
        atmosphere: 8,
        writing: 9,
        plot: 8,
        intrigue: 9,
        logic: 7,
        enjoyment: 9,
      },
    },
  }

  test('should render book title and authors', () => {
    render(<PublicReviewDisplay sharedReview={mockSharedReview} />)

    expect(screen.getByText('Test Book Title')).toBeInTheDocument()
    expect(screen.getByText('Test Author, Co-Author')).toBeInTheDocument()
  })

  test('should render CAWPILE rating section', () => {
    render(<PublicReviewDisplay sharedReview={mockSharedReview} />)

    expect(screen.getByText('CAWPILE Rating')).toBeInTheDocument()
    expect(screen.getByText(/8.5\/10/)).toBeInTheDocument()
  })

  test('should render review text when provided', () => {
    render(<PublicReviewDisplay sharedReview={mockSharedReview} />)

    expect(screen.getByText('Review')).toBeInTheDocument()
    expect(screen.getByText('This is a test review of the book.')).toBeInTheDocument()
  })

  test('should hide review section when review is null', () => {
    const reviewWithoutText = {
      ...mockSharedReview,
      userBook: {
        ...mockSharedReview.userBook,
        review: null,
      },
    }

    render(<PublicReviewDisplay sharedReview={reviewWithoutText} />)

    expect(screen.queryByText('Review')).not.toBeInTheDocument()
  })

  test('should show reading dates when showDates is true', () => {
    render(<PublicReviewDisplay sharedReview={mockSharedReview} />)

    expect(screen.getByText(/Reading period:/)).toBeInTheDocument()
    // Check for date components rather than exact format
    expect(screen.getByText(/January/)).toBeInTheDocument()
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  test('should hide reading dates when showDates is false', () => {
    const reviewWithoutDates = {
      ...mockSharedReview,
      showDates: false,
    }

    render(<PublicReviewDisplay sharedReview={reviewWithoutDates} />)

    expect(screen.queryByText(/Reading period:/)).not.toBeInTheDocument()
  })

  test('should show book club when showBookClubs is true', () => {
    render(<PublicReviewDisplay sharedReview={mockSharedReview} />)

    expect(screen.getByText(/Book club:/)).toBeInTheDocument()
    expect(screen.getByText('Test Book Club')).toBeInTheDocument()
  })

  test('should hide book club when showBookClubs is false', () => {
    const reviewWithoutBookClub = {
      ...mockSharedReview,
      showBookClubs: false,
    }

    render(<PublicReviewDisplay sharedReview={reviewWithoutBookClub} />)

    expect(screen.queryByText(/Book club:/)).not.toBeInTheDocument()
  })

  test('should show readathon when showReadathons is true', () => {
    render(<PublicReviewDisplay sharedReview={mockSharedReview} />)

    expect(screen.getByText(/Readathon:/)).toBeInTheDocument()
    expect(screen.getByText('Test Readathon')).toBeInTheDocument()
  })

  test('should hide readathon when showReadathons is false', () => {
    const reviewWithoutReadathon = {
      ...mockSharedReview,
      showReadathons: false,
    }

    render(<PublicReviewDisplay sharedReview={reviewWithoutReadathon} />)

    expect(screen.queryByText(/Readathon:/)).not.toBeInTheDocument()
  })

  test('should hide entire Reading Details section when all metadata fields are hidden', () => {
    const reviewWithNoMetadata = {
      ...mockSharedReview,
      showDates: false,
      showBookClubs: false,
      showReadathons: false,
    }

    render(<PublicReviewDisplay sharedReview={reviewWithNoMetadata} />)

    expect(screen.queryByText('Reading Details')).not.toBeInTheDocument()
  })

  test('should render Powered by CAWPILE.org footer', () => {
    render(<PublicReviewDisplay sharedReview={mockSharedReview} />)

    expect(screen.getByText('Powered by CAWPILE.org')).toBeInTheDocument()
  })
})
