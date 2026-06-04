import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import BookPageClient from '@/components/book/BookPageClient'
import type { BookPageData } from '@/types/book-page'

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

// Stub the button so we only assert it is wired with the edition id.
jest.mock('@/components/book/TrackBookButton', () => ({
  __esModule: true,
  default: ({ editionId, bookId }: { editionId: string; bookId: string }) => (
    <div data-testid="track-button" data-edition={editionId} data-book={bookId} />
  ),
}))

const data: BookPageData = {
  book: { id: 'book-1', title: 'The Book', authors: ['Author A'], bookType: 'FICTION' as const },
  edition: {
    id: 'ed-1',
    title: null,
    defaultCoverProvider: null,
    googleBook: null,
    hardcoverBook: null,
    ibdbBook: null,
  },
  aggregatedRating: null,
  publicReviews: [],
  reviewsCapped: false,
  totalRatingCount: 0,
}

describe('BookPageClient — track button', () => {
  it('renders TrackBookButton wired to the edition and book ids', () => {
    render(<BookPageClient data={data} />)
    const button = screen.getByTestId('track-button')
    expect(button).toHaveAttribute('data-edition', 'ed-1')
    expect(button).toHaveAttribute('data-book', 'book-1')
  })
})
