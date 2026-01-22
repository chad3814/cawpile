/**
 * Tests for ProfilePageClient TBR section
 * Task Group 7.1: Tests for TBR section
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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

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
        }
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

  test('should display count format "5 of 23 books" when totalCount exceeds 5', () => {
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

    expect(screen.getByText('Showing 5 of 23 books')).toBeInTheDocument()
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

    // Should show title and author
    expect(screen.getByText('TBR Book One')).toBeInTheDocument()
    expect(screen.getByText('Author One')).toBeInTheDocument()

    // Should not show progress bar, status badge, or dates
    expect(screen.queryByText(/Progress/)).not.toBeInTheDocument()
    expect(screen.queryByText('Want to Read', { selector: '.status-badge' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Finished/)).not.toBeInTheDocument()
  })
})
