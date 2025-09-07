"use client"

import { useState } from 'react'
import Image from 'next/image'
import { BookStatus, BookFormat } from '@prisma/client'
import UpdateProgressModal from '@/components/modals/UpdateProgressModal'
import { useRouter } from 'next/navigation'

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

const formatIcons = {
  HARDCOVER: '📖',
  PAPERBACK: '📗',
  EBOOK: '📱',
  AUDIOBOOK: '🎧'
}

export default function BookCard({ book }: BookCardProps) {
  const router = useRouter()
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false)
  const displayTitle = book.edition.title || book.edition.book.title
  const authors = book.edition.book.authors
  const imageUrl = book.edition.googleBook?.imageUrl

  const handleUpdateProgress = async (bookId: string, progress: number) => {
    try {
      const response = await fetch(`/api/user/books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress }),
      })

      if (!response.ok) {
        throw new Error('Failed to update progress')
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm hover:shadow-md card-hover overflow-hidden border border-border">
      {/* Book Cover */}
      <div className="aspect-[3/4] relative bg-muted">
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
        <h3 className="font-semibold text-card-foreground line-clamp-2 mb-1">
          {displayTitle}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
          {authors.join(', ')}
        </p>

        {/* Status Badge and Format */}
        <div className="flex items-center justify-between mb-3">
          <span className={statusColors[book.status]}>
            {statusLabels[book.status]}
          </span>
          <span className="text-lg" title={book.format}>
            {formatIcons[book.format]}
          </span>
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
              />
            </div>
            <button
              onClick={() => setIsProgressModalOpen(true)}
              className="w-full text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Update Progress
            </button>
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

    {/* Update Progress Modal */}
    {book.status === 'READING' && (
      <UpdateProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        book={{
          id: book.id,
          title: displayTitle,
          currentProgress: book.progress,
          pageCount: book.edition.googleBook?.pageCount,
        }}
        onUpdate={handleUpdateProgress}
      />
    )}
    </>
  )
}