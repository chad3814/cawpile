"use client"

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { BookStatus, BookFormat } from '@prisma/client'
import { convertToStars } from '@/types/cawpile'
import EmptyLibrary from './EmptyLibrary'

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

interface BookTableProps {
  books: BookData[]
}

export default function BookTable({ books }: BookTableProps) {
  const router = useRouter()

  if (books.length === 0) {
    return <EmptyLibrary />
  }

  // Separate books by status
  const readingBooks = books.filter(book => book.status === 'READING')
  const otherBooks = books.filter(book => book.status !== 'READING')

  const handleRowClick = (bookId: string) => {
    router.push(`/book/${bookId}`)
  }

  const getStatusDisplay = (status: BookStatus) => {
    switch (status) {
      case 'READING':
        return 'Currently Reading'
      case 'COMPLETED':
        return 'Completed'
      case 'DNF':
        return 'DNF'
      case 'WANT_TO_READ':
        return 'Want to Read'
      default:
        return status
    }
  }

  const getStatusColor = (status: BookStatus) => {
    switch (status) {
      case 'READING':
        return 'text-blue-600 dark:text-blue-400'
      case 'COMPLETED':
        return 'text-green-600 dark:text-green-400'
      case 'DNF':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'WANT_TO_READ':
        return 'text-purple-600 dark:text-purple-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatEndingMonth = (date: Date | null) => {
    if (!date) return '--'
    const monthYear = new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
    return monthYear
  }

  const renderRating = (rating: BookData['cawpileRating']) => {
    if (!rating) return '--'
    const stars = convertToStars(rating.average)
    if (stars === 0) return '--'
    return '⭐'.repeat(stars)
  }

  const renderBookRow = (book: BookData) => {
    const displayTitle = book.edition.title || book.edition.book.title
    const authors = book.edition.book.authors.join(', ')
    const imageUrl = book.edition.googleBook?.imageUrl

    return (
      <tr
        key={book.id}
        onClick={() => handleRowClick(book.id)}
        className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
      >
        {/* Cover Image */}
        <td className="p-3 border-r border-border w-16">
          <div className="relative w-12 h-16 bg-muted rounded overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={displayTitle}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                No Cover
              </div>
            )}
          </div>
        </td>

        {/* Title */}
        <td className="p-3 border-r border-border" title={displayTitle}>
          <div className="font-medium text-foreground truncate max-w-xs">
            {displayTitle}
          </div>
        </td>

        {/* Author(s) */}
        <td className="p-3 border-r border-border" title={authors}>
          <div className="text-muted-foreground truncate max-w-xs">
            {authors || '--'}
          </div>
        </td>

        {/* Status */}
        <td className="p-3 border-r border-border">
          <span className={`font-medium ${getStatusColor(book.status)}`} title="Status">
            {getStatusDisplay(book.status)}
          </span>
        </td>

        {/* Rating */}
        <td className="p-3 border-r border-border" title="Rating">
          <div className="text-foreground">
            {renderRating(book.cawpileRating)}
          </div>
        </td>

        {/* Ending Month */}
        <td className="p-3" title="Ending Month">
          <div className="text-muted-foreground">
            {book.status === 'COMPLETED' ? formatEndingMonth(book.finishDate) : '--'}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div>
      {/* Currently Reading Section */}
      {readingBooks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Currently Reading
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-lg overflow-hidden">
              <tbody>
                {readingBooks.map(renderBookRow)}
              </tbody>
            </table>
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
          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-lg overflow-hidden">
              <tbody>
                {otherBooks.map(renderBookRow)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}