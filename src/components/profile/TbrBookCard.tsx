'use client'

import Image from 'next/image'
import { ProfileBookData } from '@/types/profile'

interface TbrBookCardProps {
  book: ProfileBookData
}

/**
 * Minimal book card for TBR display on public profile
 * Shows only cover image, title, and author - no dates, progress, or ratings
 */
export default function TbrBookCard({ book }: TbrBookCardProps) {
  const displayTitle = book.edition.title || book.edition.book.title
  const authors = book.edition.book.authors
  const imageUrl = book.edition.googleBook?.imageUrl

  return (
    <div className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow border border-border">
      {/* Book Cover */}
      <div className="aspect-[3/4] relative bg-muted overflow-hidden rounded-t-lg">
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
      </div>

      {/* Book Details - Title and Author Only */}
      <div className="p-4">
        <h3 className="font-semibold text-card-foreground line-clamp-2 mb-1">
          {displayTitle}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {authors.join(', ')}
        </p>
      </div>
    </div>
  )
}
