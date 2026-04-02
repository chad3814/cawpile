"use client"

import BookCard from './BookCard'
import EmptyLibrary from './EmptyLibrary'
import HeroScrollRow from '@/components/HeroScrollRow'
import type { DashboardBookData } from '@/types/dashboard'

interface BookGridProps {
  books: DashboardBookData[]
}

export default function BookGrid({ books }: BookGridProps) {
  if (books.length === 0) {
    return <EmptyLibrary />
  }

  // Separate books by status
  const readingBooks = books.filter(book => book.status === 'READING')
  const tbrBooks = books.filter(book => book.status === 'WANT_TO_READ')
  const completedBooks = books.filter(book => book.status === 'COMPLETED' || book.status === 'DNF')

  return (
    <div>
      {/* Currently Reading Section */}
      {readingBooks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Currently Reading
          </h2>
          <HeroScrollRow>
            {readingBooks.map((book) => (
              <div key={book.id} className="shrink-0 w-40">
                <BookCard book={book} />
              </div>
            ))}
          </HeroScrollRow>
        </div>
      )}

      {/* TBR Section */}
      {tbrBooks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            To Be Read
          </h2>
          <HeroScrollRow>
            {tbrBooks.map((book) => (
              <div key={book.id} className="shrink-0 w-40">
                <BookCard book={book} />
              </div>
            ))}
          </HeroScrollRow>
        </div>
      )}

      {/* Completed Section */}
      {completedBooks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Completed
          </h2>
          <HeroScrollRow>
            {completedBooks.map((book) => (
              <div key={book.id} className="shrink-0 w-40">
                <BookCard book={book} />
              </div>
            ))}
          </HeroScrollRow>
        </div>
      )}
    </div>
  )
}