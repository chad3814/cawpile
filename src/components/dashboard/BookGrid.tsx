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

  const readingBooks = books.filter(book => book.status === 'READING')
  const tbrBooks = books.filter(book => book.status === 'WANT_TO_READ')
  const completedBooks = books.filter(book => book.status === 'COMPLETED' || book.status === 'DNF')

  return (
    <div>
      {readingBooks.length > 0 && (
        <div id="currently-reading" className="mb-8 scroll-mt-8">
          <HeroScrollRow title="Currently Reading">
            {readingBooks.map((book) => (
              <div key={book.id} className="shrink-0 w-40">
                <BookCard book={book} />
              </div>
            ))}
          </HeroScrollRow>
        </div>
      )}

      {tbrBooks.length > 0 && (
        <div id="tbr" className="mb-8 scroll-mt-8">
          <HeroScrollRow title="To Be Read">
            {tbrBooks.map((book) => (
              <div key={book.id} className="shrink-0 w-40">
                <BookCard book={book} />
              </div>
            ))}
          </HeroScrollRow>
        </div>
      )}

      {completedBooks.length > 0 && (
        <div id="completed" className="mb-8 scroll-mt-8">
          <HeroScrollRow title="Completed">
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
