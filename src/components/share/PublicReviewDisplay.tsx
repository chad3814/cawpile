'use client'

import Image from 'next/image'
import PublicCawpileFacetDisplay from '@/components/share/PublicCawpileFacetDisplay'
import StarRating from '@/components/rating/StarRating'
import { BookType } from '@/types/cawpile'
import { sanitizeHtml } from '@/lib/utils/sanitize'

interface PublicReviewDisplayProps {
  sharedReview: {
    id: string
    showDates: boolean
    showBookClubs: boolean
    showReadathons: boolean
    showReview: boolean
    userBook: {
      startDate: Date | null
      finishDate: Date | null
      bookClubName: string | null
      readathonName: string | null
      review: string | null
      edition: {
        title: string | null
        book: {
          title: string
          authors: string[]
          bookType?: 'FICTION' | 'NONFICTION'
        }
        googleBook: {
          imageUrl: string | null
          description: string | null
        } | null
      }
      cawpileRating: {
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
  }
}

export default function PublicReviewDisplay({ sharedReview }: PublicReviewDisplayProps) {
  const { userBook, showDates, showBookClubs, showReadathons, showReview } = sharedReview
  const { edition, cawpileRating, review, startDate, finishDate, bookClubName, readathonName } = userBook

  const displayTitle = edition.title || edition.book.title
  const authors = edition.book.authors
  const imageUrl = edition.googleBook?.imageUrl
  const description = edition.googleBook?.description
  const bookType = (edition.book.bookType || 'FICTION') as BookType

  const formatDate = (date: Date | null) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        {/* Book Header */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Book Cover */}
            {imageUrl && (
              <div className="flex-shrink-0 w-48 mx-auto sm:mx-0">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={imageUrl}
                    alt={displayTitle}
                    fill
                    className="object-cover"
                    sizes="192px"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Book Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-card-foreground mb-2">
                {displayTitle}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {authors.join(', ')}
              </p>

              {/* Overall Rating */}
              {cawpileRating && (
                <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <StarRating
                      rating={cawpileRating.average}
                      showAverage={false}
                      size="lg"
                    />
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground">
                        ({cawpileRating.average.toFixed(1)}/10)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Book Description */}
              {description && (
                <div className="mt-4 max-h-40 overflow-hidden">
                  <div
                    className="text-sm text-muted-foreground line-clamp-6"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CAWPILE Rating Details */}
        {cawpileRating && (
          <div className="px-6 sm:px-8 pb-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              CAWPILE Rating
            </h2>
            <PublicCawpileFacetDisplay
              rating={cawpileRating}
              bookType={bookType}
            />
          </div>
        )}

        {/* Review Text */}
        {showReview && review && (
          <div className="px-6 sm:px-8 pb-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-3">
              Review
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-card-foreground whitespace-pre-wrap">
                {review}
              </p>
            </div>
          </div>
        )}

        {/* Metadata Section */}
        {(showDates && (startDate || finishDate)) || (showBookClubs && bookClubName) || (showReadathons && readathonName) ? (
          <div className="px-6 sm:px-8 pb-6 border-t border-border pt-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-3">
              Reading Details
            </h2>
            <div className="space-y-2 text-sm">
              {showDates && (startDate || finishDate) && (
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <span className="text-muted-foreground">Reading period: </span>
                    <span className="text-card-foreground">
                      {startDate && finishDate
                        ? `${formatDate(startDate)} - ${formatDate(finishDate)}`
                        : startDate
                        ? `Started ${formatDate(startDate)}`
                        : finishDate
                        ? `Finished ${formatDate(finishDate)}`
                        : 'Not recorded'}
                    </span>
                  </div>
                </div>
              )}

              {showBookClubs && bookClubName && (
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <span className="text-muted-foreground">Book club: </span>
                    <span className="text-card-foreground font-medium">{bookClubName}</span>
                  </div>
                </div>
              )}

              {showReadathons && readathonName && (
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <span className="text-muted-foreground">Readathon: </span>
                    <span className="text-card-foreground font-medium">{readathonName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-muted/30 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Powered by Cawpile
          </p>
        </div>
      </div>
    </div>
  )
}
