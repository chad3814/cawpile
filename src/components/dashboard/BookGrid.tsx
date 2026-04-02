"use client"

import BookCard from './BookCard'
import EmptyLibrary from './EmptyLibrary'
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {readingBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}

      {/* TBR Section */}
      {tbrBooks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            To Be Read
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tbrBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Section */}
      {completedBooks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Completed
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {completedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}