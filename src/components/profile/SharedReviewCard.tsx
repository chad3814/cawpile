'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ProfileSharedReview } from '@/types/profile'
import { convertToStars } from '@/types/cawpile'

interface SharedReviewCardProps {
  review: ProfileSharedReview
}

/**
 * Shared review preview card for profile display
 * Links to the full review page at /share/reviews/[shareToken]
 */
export default function SharedReviewCard({ review }: SharedReviewCardProps) {
  const { userBook, shareToken, showDates, showBookClubs, showReadathons } = review
  const displayTitle = userBook.edition.title || userBook.edition.book.title
  const authors = userBook.edition.book.authors
  const imageUrl = userBook.edition.googleBook?.imageUrl
  const rating = userBook.cawpileRating

  const formatDate = (date: Date | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <Link
      href={`/share/reviews/${shareToken}`}
      className="block bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-border overflow-hidden group"
    >
      <div className="flex gap-4 p-4">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          <div className="relative w-16 h-24 sm:w-20 sm:h-28 bg-muted rounded overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={displayTitle}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <svg
                  className="w-8 h-10 text-muted-foreground/60"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
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
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {displayTitle}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {authors.join(', ')}
          </p>

          {/* Star Rating */}
          {rating && (
            <div className="mt-2">
              <span className="text-sm">
                {convertToStars(rating.average) > 0
                  ? Array(convertToStars(rating.average)).fill(null).map((_, i) => (
                      <span key={i} role="img" aria-label="star">&#11088;</span>
                    ))
                  : Array(5).fill(null).map((_, i) => (
                      <span key={i} role="img" aria-label="empty star">&#9734;</span>
                    ))
                }
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                ({rating.average.toFixed(1)}/10)
              </span>
            </div>
          )}

          {/* Metadata based on visibility flags */}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {showDates && userBook.finishDate && (
              <span>Finished {formatDate(userBook.finishDate)}</span>
            )}
            {showBookClubs && userBook.bookClubName && (
              <span className="flex items-center gap-1">
                <span role="img" aria-label="book club">&#128218;</span>
                {userBook.bookClubName}
              </span>
            )}
            {showReadathons && userBook.readathonName && (
              <span className="flex items-center gap-1">
                <span role="img" aria-label="readathon">&#127939;</span>
                {userBook.readathonName}
              </span>
            )}
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="flex-shrink-0 self-center">
          <svg
            className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  )
}
