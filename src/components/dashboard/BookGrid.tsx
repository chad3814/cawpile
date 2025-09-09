"use client"

import BookCard from './BookCard'
import EmptyLibrary from './EmptyLibrary'
import { BookStatus, BookFormat } from '@prisma/client'

interface BookData {
  id: string
  status: BookStatus
  format: BookFormat
  progress: number
  startDate: Date | null
  finishDate: Date | null
  createdAt: Date
  edition: {
    id: string
    title: string | null
    book: {
      title: string
      authors: string[]
      bookType?: 'FICTION' | 'NONFICTION'
    }
    googleBook: {
      imageUrl: string | null
      description: string | null
      pageCount: number | null
    } | null
  }
  cawpileRating?: {
    id: string
    average: number
    characters: number | null
    atmosphere: number | null
    writing: number | null
    plot: number | null
    intrigue: number | null
    logic: number | null
    enjoyment: number | null
  } | null
}

interface BookGridProps {
  books: BookData[]
}

export default function BookGrid({ books }: BookGridProps) {
  if (books.length === 0) {
    return <EmptyLibrary />
  }

  // Separate books by status
  const readingBooks = books.filter(book => book.status === 'READING')
  const otherBooks = books.filter(book => book.status !== 'READING')

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

      {/* Other Books Section */}
      {otherBooks.length > 0 && (
        <div>
          {readingBooks.length > 0 && (
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Library
            </h2>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {otherBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}