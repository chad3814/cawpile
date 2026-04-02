'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { ProfileBookData } from '@/types/profile'
import { convertToStars } from '@/types/cawpile'
import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl'

interface ProfileBookCardProps {
  book: ProfileBookData
}

const statusColors = {
  WANT_TO_READ: 'status-badge status-want-to-read',
  READING: 'status-badge status-reading',
  COMPLETED: 'status-badge status-completed',
  DNF: 'status-badge status-dnf'
}

const statusLabels = {
  WANT_TO_READ: 'Want to Read',
  READING: 'Reading',
  COMPLETED: 'Completed',
  DNF: 'Did Not Finish'
}

const formatIcons: Record<string, string> = {
  HARDCOVER: '&#128214;',
  PAPERBACK: '&#128215;',
  EBOOK: '&#128241;',
  AUDIOBOOK: '&#127911;'
}

/**
 * Read-only book card for public profile display
 * Matches BookCard's collapsible layout without interactive actions
 */
export default function ProfileBookCard({ book }: ProfileBookCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const displayTitle = book.edition.title || book.edition.book.title
  const authors = book.edition.book.authors
  const imageUrl = getCoverImageUrl(book.edition, book.preferredCoverProvider)
  const pageCount = book.edition.googleBook?.pageCount

  return (
    <div className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-border relative">
      {/* Book Cover */}
      <div className="aspect-[3/4] relative bg-muted overflow-hidden">
        {/* Star Rating Badge */}
        {book.cawpileRating && (
          <div className="absolute top-2 left-2 z-10 bg-black/75 backdrop-blur-sm rounded px-2 py-1 shadow-lg">
            <span className="text-sm">
              {convertToStars(book.cawpileRating.average) > 0
                ? Array(convertToStars(book.cawpileRating.average)).fill(null).map((_, i) => (
                    <span key={i} role="img" aria-label="star">&#11088;</span>
                  ))
                : Array(5).fill(null).map((_, i) => (
                    <span key={i} role="img" aria-label="empty star">&#9734;</span>
                  ))
              }
            </span>
          </div>
        )}

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
              className="w-16 h-20 text-muted-foreground/60"
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

        {/* Progress bar overlay — only when collapsed and currently reading */}
        {!isExpanded && book.status === 'READING' && (
          <div className="absolute bottom-0 left-0 right-0 z-10 px-2 pt-4 pb-2 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex justify-between text-xs text-white mb-1">
              <span>Progress</span>
              <span>{Math.round(book.progress)}%</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-1.5">
              <div
                className="bg-white h-1.5 rounded-full transition-all"
                style={{ width: `${book.progress}%` }}
                role="progressbar"
                aria-valuenow={Math.round(book.progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}
      </div>

      {/* Title row — always visible, toggles the info section */}
      <button
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full px-3 py-2 flex items-start justify-between text-left"
        aria-expanded={isExpanded}
        aria-controls={`profile-book-info-${book.id}`}
      >
        <span className="font-semibold text-card-foreground line-clamp-2 text-sm flex-1 mr-1">
          {displayTitle}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsible info section */}
      <div
        id={`profile-book-info-${book.id}`}
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-4">
            {/* Author */}
            <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
              {authors.join(', ')}
            </p>

            {/* Status Badge and Format */}
            <div className="flex items-center justify-between mb-3">
              <span className={statusColors[book.status]}>
                {statusLabels[book.status]}
              </span>
              <div className="flex gap-1">
                {book.format.map((fmt) => (
                  <span
                    key={fmt}
                    className="text-lg"
                    title={fmt}
                    dangerouslySetInnerHTML={{ __html: formatIcons[fmt] || '' }}
                  />
                ))}
              </div>
            </div>

            {/* Progress Bar (for reading books) */}
            {book.status === 'READING' && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round(book.progress)}%</span>
                </div>
                <div className="w-full bg-border rounded-full h-2 mb-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${book.progress}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(book.progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                {book.currentPage > 0 && pageCount && (
                  <p className="text-xs text-muted-foreground text-center">
                    Page {book.currentPage} of {pageCount}
                  </p>
                )}
              </div>
            )}

            {/* Completion Date (for completed books) */}
            {book.status === 'COMPLETED' && book.finishDate && (
              <p className="text-xs text-muted-foreground">
                Finished {new Date(book.finishDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
