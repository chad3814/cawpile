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
      <div id="currently-reading" className="mb-8 scroll-mt-8">
        {readingBooks.length > 0 ? (
          <HeroScrollRow title="Currently Reading">
            {readingBooks.map((book) => (
              <div key={book.id} className="shrink-0 w-40">
                <BookCard book={book} />
              </div>
            ))}
          </HeroScrollRow>
        ) : (
          <p className="text-sm text-muted-foreground">No books currently being read.</p>
        )}
      </div>

      <div id="tbr" className="mb-8 scroll-mt-8">
        {tbrBooks.length > 0 ? (
          <HeroScrollRow title="To Be Read">
            {tbrBooks.map((book) => (
              <div key={book.id} className="shrink-0 w-40">
                <BookCard book={book} />
              </div>
            ))}
          </HeroScrollRow>
        ) : (
          <p className="text-sm text-muted-foreground">No books in your TBR list.</p>
        )}
      </div>

      <div id="completed" className="mb-8 scroll-mt-8">
        {completedBooks.length > 0 ? (
          <HeroScrollRow title="Completed">
            {completedBooks.map((book) => (
              <div key={book.id} className="shrink-0 w-40">
                <BookCard book={book} />
              </div>
            ))}
          </HeroScrollRow>
        ) : (
          <p className="text-sm text-muted-foreground">No completed books yet.</p>
        )}
      </div>
    </div>
  )
}
