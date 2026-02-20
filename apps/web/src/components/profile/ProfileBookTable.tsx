'use client'

import Image from 'next/image'
import { ProfileBookData } from '@/types/profile'
import { convertToStars } from '@/types/cawpile'
import ProfileEmptyState from './ProfileEmptyState'

interface ProfileBookTableProps {
  books: ProfileBookData[]
}

/**
 * Read-only book table for public profile display
 * Removed row click navigation from dashboard BookTable
 */
export default function ProfileBookTable({ books }: ProfileBookTableProps) {
  if (books.length === 0) {
    return <ProfileEmptyState variant="currently-reading" />
  }

  const getStatusDisplay = (status: ProfileBookData['status']) => {
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

  const getStatusColor = (status: ProfileBookData['status']) => {
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

  const renderRating = (rating: ProfileBookData['cawpileRating']) => {
    if (!rating) return '--'
    const stars = convertToStars(rating.average)
    if (stars === 0) return '--'
    return Array(stars).fill(null).map((_, i) => (
      <span key={i} role="img" aria-label="star">&#11088;</span>
    ))
  }

  const renderBookRow = (book: ProfileBookData) => {
    const displayTitle = book.edition.title || book.edition.book.title
    const authors = book.edition.book.authors.join(', ')
    const imageUrl = book.edition.googleBook?.imageUrl

    return (
      <tr
        key={book.id}
        className="border-b border-border hover:bg-muted/50 transition-colors"
      >
        {/* Mobile Layout - Two rows */}
        <td className="sm:hidden p-3" colSpan={6}>
          <div className="grid grid-cols-[48px_1fr] gap-3 max-w-full">
            {/* Cover Image - spans both rows */}
            <div className="row-span-2">
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
            </div>
            {/* Top row: Important data */}
            <div className="space-y-1 min-w-0">
              <div className="font-medium text-foreground truncate max-w-full">{displayTitle}</div>
              <div className="text-sm text-muted-foreground truncate max-w-full">{authors || '--'}</div>
              <span className={`text-sm font-medium ${getStatusColor(book.status)}`}>
                {getStatusDisplay(book.status)}
              </span>
            </div>
            {/* Bottom row: Secondary data */}
            <div className="col-start-2 flex gap-4 text-sm min-w-0">
              <div className="text-foreground">{renderRating(book.cawpileRating)}</div>
              {book.status === 'READING' && (
                <div className="text-muted-foreground">{Math.round(book.progress)}%</div>
              )}
            </div>
          </div>
        </td>

        {/* Desktop Layout - Single row */}
        {/* Cover Image */}
        <td className="hidden sm:table-cell p-3 border-r border-border w-16">
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
        <td className="hidden sm:table-cell p-3 border-r border-border" title={displayTitle}>
          <div className="font-medium text-foreground truncate max-w-xs">
            {displayTitle}
          </div>
        </td>

        {/* Author(s) */}
        <td className="hidden sm:table-cell p-3 border-r border-border" title={authors}>
          <div className="text-muted-foreground truncate max-w-xs">
            {authors || '--'}
          </div>
        </td>

        {/* Status */}
        <td className="hidden sm:table-cell p-3 border-r border-border">
          <span className={`font-medium ${getStatusColor(book.status)}`} title="Status">
            {getStatusDisplay(book.status)}
          </span>
        </td>

        {/* Rating */}
        <td className="hidden sm:table-cell p-3 border-r border-border" title="Rating">
          <div className="text-foreground">
            {renderRating(book.cawpileRating)}
          </div>
        </td>

        {/* Progress (for reading) or Ending Month (for completed) */}
        <td className="hidden sm:table-cell p-3" title={book.status === 'READING' ? 'Progress' : 'Ending Month'}>
          <div className="text-muted-foreground">
            {book.status === 'READING'
              ? `${Math.round(book.progress)}%`
              : book.status === 'COMPLETED'
                ? formatEndingMonth(book.finishDate)
                : '--'}
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="overflow-x-auto sm:overflow-x-visible">
      <table className="w-full border border-border rounded-lg overflow-hidden">
        <tbody>
          {books.map(renderBookRow)}
        </tbody>
      </table>
    </div>
  )
}
