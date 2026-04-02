/**
 * Tests for ProfilePageClient
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProfilePageClient from '@/components/profile/ProfilePageClient'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('ProfilePageClient TBR Section', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    username: 'testuser',
    bio: 'Test bio',
    profilePictureUrl: null,
    image: null,
    showCurrentlyReading: false,
    profileEnabled: true,
    showTbr: true
  }

  const mockTbrBooks = [
    {
      id: 'userbook-1',
      status: 'WANT_TO_READ' as const,
      format: ['PAPERBACK' as const],
      progress: 0,
      startDate: null,
      finishDate: null,
      createdAt: new Date('2024-01-15'),
      currentPage: 0,
      edition: {
        id: 'edition-1',
        title: null,
        book: {
          title: 'TBR Book One',
          authors: ['Author One'],
          bookType: 'FICTION' as const
        },
        googleBook: {
          imageUrl: 'https://example.com/cover1.jpg',
          description: 'A great book',
          pageCount: 300
        },
        hardcoverBook: null,
        ibdbBook: null
      },
      cawpileRating: null
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render TBR section when showTbr is true and books exist', () => {
    render(
      <ProfilePageClient
        user={mockUser}
        currentlyReading={[]}
        sharedReviews={[]}
        tbr={{ books: mockTbrBooks, totalCount: 1 }}
      />
    )

    expect(screen.getByText('Want to Read')).toBeInTheDocument()
    expect(screen.getByText('TBR Book One')).toBeInTheDocument()
    expect(screen.getByText('Author One')).toBeInTheDocument()
  })

  test('should hide TBR section when showTbr is false', () => {
    const userWithTbrDisabled = { ...mockUser, showTbr: false }

    render(
      <ProfilePageClient
        user={userWithTbrDisabled}
        currentlyReading={[]}
        sharedReviews={[]}
        tbr={{ books: mockTbrBooks, totalCount: 1 }}
      />
    )

    expect(screen.queryByText('Want to Read')).not.toBeInTheDocument()
  })

  test('should render all provided TBR books in the carousel without a count label', () => {
    const manyBooks = Array(5).fill(null).map((_, i) => ({
      ...mockTbrBooks[0],
      id: `userbook-${i}`,
      edition: {
        ...mockTbrBooks[0].edition,
        id: `edition-${i}`,
        book: {
          ...mockTbrBooks[0].edition.book,
          title: `TBR Book ${i + 1}`
        }
      }
    }))

    render(
      <ProfilePageClient
        user={mockUser}
        currentlyReading={[]}
        sharedReviews={[]}
        tbr={{ books: manyBooks, totalCount: 23 }}
      />
    )

    // All books passed in should render
    expect(screen.getByText('TBR Book 1')).toBeInTheDocument()
    expect(screen.getByText('TBR Book 5')).toBeInTheDocument()
    // Carousel mode has no count label
    expect(screen.queryByText(/Showing \d+ of \d+ books/)).not.toBeInTheDocument()
  })

  test('should display only cover, title, author for TBR books (no dates, progress, ratings)', () => {
    render(
      <ProfilePageClient
        user={mockUser}
        currentlyReading={[]}
        sharedReviews={[]}
        tbr={{ books: mockTbrBooks, totalCount: 1 }}
      />
    )

    expect(screen.getByText('TBR Book One')).toBeInTheDocument()
    expect(screen.getByText('Author One')).toBeInTheDocument()

    // Should not show progress bar, status badge, or dates
    expect(screen.queryByText(/Progress/)).not.toBeInTheDocument()
    expect(screen.queryByText('Want to Read', { selector: '.status-badge' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Finished/)).not.toBeInTheDocument()
  })

  test('should not render layout toggle', () => {
    const userWithReading = { ...mockUser, showCurrentlyReading: true }
    const mockReadingBook = {
      ...mockTbrBooks[0],
      id: 'reading-1',
      status: 'READING' as const,
      edition: { ...mockTbrBooks[0].edition, id: 'edition-r1', book: { ...mockTbrBooks[0].edition.book, title: 'Reading Book' } }
    }

    render(
      <ProfilePageClient
        user={userWithReading}
        currentlyReading={[mockReadingBook]}
        sharedReviews={[]}
        tbr={null}
      />
    )

    expect(screen.queryByRole('button', { name: /grid|table/i })).not.toBeInTheDocument()
  })
})
