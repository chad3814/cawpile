'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ProfileSharedReview } from '@/types/profile'
import { convertToStars } from '@/types/cawpile'
import ProfileEmptyState from './ProfileEmptyState'

interface SharedReviewsTableProps {
  reviews: ProfileSharedReview[]
}

/**
 * Table view for shared reviews on profile page
 * Links each row to the full review page at /share/reviews/[shareToken]
 */
export default function SharedReviewsTable({ reviews }: SharedReviewsTableProps) {
  if (reviews.length === 0) {
    return <ProfileEmptyState variant="reviews" />
  }

  const formatFinishDate = (date: Date | null) => {
    if (!date) return '--'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }

  const renderRating = (rating: ProfileSharedReview['userBook']['cawpileRating']) => {
    if (!rating) return '--'
    const stars = convertToStars(rating.average)
    if (stars === 0) return '--'
    return (
      <span className="inline-flex items-center gap-1">
        <span>
          {Array(stars).fill(null).map((_, i) => (
            <span key={i} role="img" aria-label="star">&#11088;</span>
          ))}
        </span>
        <span className="text-xs text-muted-foreground">
          ({rating.average.toFixed(1)}/10)
        </span>
      </span>
    )
  }

  const renderReviewRow = (review: ProfileSharedReview) => {
    const { userBook, shareToken } = review
    const displayTitle = userBook.edition.title || userBook.edition.book.title
    const authors = userBook.edition.book.authors.join(', ')
    const imageUrl = userBook.edition.googleBook?.imageUrl

    return (
      <tr key={review.id} className="border-b border-border hover:bg-muted/50 transition-colors">
        {/* Mobile Layout - Two rows */}
        <td className="sm:hidden p-3" colSpan={5}>
          <Link href={`/share/reviews/${shareToken}`} className="block">
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
              {/* Top row: Title and Author */}
              <div className="space-y-1 min-w-0">
                <div className="font-medium text-foreground truncate max-w-full">{displayTitle}</div>
                <div className="text-sm text-muted-foreground truncate max-w-full">{authors || '--'}</div>
              </div>
              {/* Bottom row: Rating and Date */}
              <div className="col-start-2 flex gap-4 text-sm min-w-0 items-center">
                <div className="text-foreground">{renderRating(userBook.cawpileRating)}</div>
                <div className="text-muted-foreground">{formatFinishDate(userBook.finishDate)}</div>
              </div>
            </div>
          </Link>
        </td>

        {/* Desktop Layout - Single row */}
        {/* Cover Image */}
        <td className="hidden sm:table-cell p-3 border-r border-border w-16">
          <Link href={`/share/reviews/${shareToken}`}>
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
          </Link>
        </td>

        {/* Title */}
        <td className="hidden sm:table-cell p-3 border-r border-border" title={displayTitle}>
          <Link href={`/share/reviews/${shareToken}`} className="hover:text-primary transition-colors">
            <div className="font-medium text-foreground truncate max-w-xs">
              {displayTitle}
            </div>
          </Link>
        </td>

        {/* Author(s) */}
        <td className="hidden sm:table-cell p-3 border-r border-border" title={authors}>
          <Link href={`/share/reviews/${shareToken}`}>
            <div className="text-muted-foreground truncate max-w-xs">
              {authors || '--'}
            </div>
          </Link>
        </td>

        {/* Rating */}
        <td className="hidden sm:table-cell p-3 border-r border-border" title="Rating">
          <Link href={`/share/reviews/${shareToken}`}>
            <div className="text-foreground">
              {renderRating(userBook.cawpileRating)}
            </div>
          </Link>
        </td>

        {/* Finish Date */}
        <td className="hidden sm:table-cell p-3" title="Finish Date">
          <Link href={`/share/reviews/${shareToken}`}>
            <div className="text-muted-foreground">
              {formatFinishDate(userBook.finishDate)}
            </div>
          </Link>
        </td>
      </tr>
    )
  }

  return (
    <div className="overflow-x-auto sm:overflow-x-visible">
      <table className="w-full border border-border rounded-lg overflow-hidden">
        <tbody>
          {reviews.map(renderReviewRow)}
        </tbody>
      </table>
    </div>
  )
}
