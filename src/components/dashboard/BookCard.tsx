import Image from 'next/image'
import { BookStatus, BookFormat } from '@prisma/client'

interface BookCardProps {
  book: {
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
      }
      googleBook: {
        imageUrl: string | null
        description: string | null
        pageCount: number | null
      } | null
    }
  }
}

const statusColors = {
  WANT_TO_READ: 'bg-gray-100 text-gray-800',
  READING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800'
}

const statusLabels = {
  WANT_TO_READ: 'Want to Read',
  READING: 'Reading',
  COMPLETED: 'Completed'
}

const formatIcons = {
  HARDCOVER: '📖',
  PAPERBACK: '📗',
  EBOOK: '📱',
  AUDIOBOOK: '🎧'
}

export default function BookCard({ book }: BookCardProps) {
  const displayTitle = book.edition.title || book.edition.book.title
  const authors = book.edition.book.authors
  const imageUrl = book.edition.googleBook?.imageUrl

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
      {/* Book Cover */}
      <div className="aspect-[3/4] relative bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={displayTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg
              className="w-16 h-20 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Book Details */}
      <div className="p-4">
        {/* Title and Author */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
          {displayTitle}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-1 mb-3">
          {authors.join(', ')}
        </p>

        {/* Status Badge and Format */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[book.status]}`}>
            {statusLabels[book.status]}
          </span>
          <span className="text-lg" title={book.format}>
            {formatIcons[book.format]}
          </span>
        </div>

        {/* Progress Bar (for reading books) */}
        {book.status === 'READING' && (
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(book.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${book.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Completion Date (for completed books) */}
        {book.status === 'COMPLETED' && book.finishDate && (
          <p className="text-xs text-gray-600">
            Finished {new Date(book.finishDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
}