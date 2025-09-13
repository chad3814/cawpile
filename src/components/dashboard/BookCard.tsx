"use client"

import { useState } from 'react'
import Image from 'next/image'
import { BookStatus, BookFormat } from '@prisma/client'
import UpdateProgressModal from '@/components/modals/UpdateProgressModal'
import CawpileRatingModal from '@/components/modals/CawpileRatingModal'
import ChangeFormatModal from '@/components/modals/ChangeFormatModal'
import MarkCompleteModal from '@/components/modals/MarkCompleteModal'
import MarkDNFModal from '@/components/modals/MarkDNFModal'
import EditBookModal from '@/components/modals/EditBookModal'
import StarRating from '@/components/rating/StarRating'
import CawpileFacetDisplay from '@/components/rating/CawpileFacetDisplay'
import { BookType, convertToStars } from '@/types/cawpile'
import { useRouter } from 'next/navigation'
import { EllipsisVerticalIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface BookCardProps {
  book: {
    id: string
    status: BookStatus
    format: BookFormat
    progress: number
    startDate: Date | null
    finishDate: Date | null
    createdAt: Date
    acquisitionMethod?: string | null
    acquisitionOther?: string | null
    bookClubName?: string | null
    readathonName?: string | null
    isReread?: boolean | null
    dnfReason?: string | null
    lgbtqRepresentation?: string | null
    lgbtqDetails?: string | null
    disabilityRepresentation?: string | null
    disabilityDetails?: string | null
    isNewAuthor?: boolean | null
    authorPoc?: string | null
    authorPocDetails?: string | null
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
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [showRatingPreview, setShowRatingPreview] = useState(false)
  const [isChangingFormat, setIsChangingFormat] = useState(false)
  const [isMarkCompleteModalOpen, setIsMarkCompleteModalOpen] = useState(false)
  const [isMarkDNFModalOpen, setIsMarkDNFModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState(book.format)
  const displayTitle = book.edition.title || book.edition.book.title
  const authors = book.edition.book.authors
  const imageUrl = book.edition.googleBook?.imageUrl
  const bookType = (book.edition.book.bookType || 'FICTION') as BookType

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

      // If progress is 100% and book doesn't have a rating, prompt for rating
      if (progress === 100 && !book.cawpileRating) {
        setIsRatingModalOpen(true)
      }

      router.refresh()
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleMarkComplete = async (bookId: string, finishDate: string) => {
    try {
      const response = await fetch(`/api/user/books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'COMPLETED',
          finishDate,
          progress: 100
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark book as complete')
      }

      // If book doesn't have a rating, prompt for rating
      if (!book.cawpileRating) {
        setIsRatingModalOpen(true)
      }

      router.refresh()
    } catch (error) {
      console.error('Error marking book as complete:', error)
    }
  }

  const handleMarkDNF = async (bookId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/user/books/${bookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DNF',
          dnfReason: reason
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to mark book as DNF')
      }

      router.refresh()
    } catch (error) {
      console.error('Error marking book as DNF:', error)
    }
  }

  const handleRemoveBook = async () => {
    if (!confirm(`Are you sure you want to remove "${displayTitle}" from your library?`)) {
      return
    }

    try {
      const response = await fetch(`/api/user/books/${book.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove book')
      }

      router.refresh()
    } catch (error) {
      console.error('Error removing book:', error)
    }
  }

  const handleFormatChange = async (newFormat: BookFormat) => {
    try {
      const response = await fetch(`/api/user/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format: newFormat }),
      })

      if (!response.ok) {
        throw new Error('Failed to update format')
      }

      setSelectedFormat(newFormat)
      setIsChangingFormat(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating format:', error)
      setSelectedFormat(book.format)
    }
  }

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm hover:shadow-md card-hover border border-border relative">
      {/* Options Menu */}
      <div className="absolute top-2 right-2 z-10">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="p-1.5 rounded-md bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-sm">
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-1 py-1">
                {book.status === 'READING' && (
                  <>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setIsMarkCompleteModalOpen(true)}
                          className={`${
                            active ? 'bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-gray-100'
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark as Complete
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setIsMarkDNFModalOpen(true)}
                          className={`${
                            active ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100' : 'text-gray-900 dark:text-gray-100'
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Mark as DNF
                        </button>
                      )}
                    </Menu.Item>
                  </>
                )}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className={`${
                        active ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Details
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsChangingFormat(true)}
                      className={`${
                        active ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-gray-100'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <ArrowPathIcon className="mr-2 h-4 w-4" />
                      Change Format
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleRemoveBook}
                      className={`${
                        active ? 'bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-100' : 'text-gray-900 dark:text-gray-100'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Remove from Library
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Book Cover */}
      <div className="aspect-[3/4] relative bg-muted overflow-hidden">
        {/* Star Rating Badge */}
        {book.cawpileRating && (
          <div className="absolute top-2 left-2 z-20 bg-black/75 backdrop-blur-sm rounded px-2 py-1 shadow-lg">
            <span className="text-sm">
              {convertToStars(book.cawpileRating.average) > 0 
                ? '⭐'.repeat(convertToStars(book.cawpileRating.average))
                : '☆☆☆☆☆'
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

        {/* Rating Display */}
        {book.cawpileRating && (
          <div 
            className="mb-3 relative"
            onMouseEnter={() => setShowRatingPreview(true)}
            onMouseLeave={() => setShowRatingPreview(false)}
          >
            <StarRating 
              rating={book.cawpileRating.average} 
              showAverage={true}
              size="sm"
            />
            
            {/* Rating Preview on Hover */}
            {showRatingPreview && (
              <div className="absolute z-10 left-0 right-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <CawpileFacetDisplay
                  rating={book.cawpileRating}
                  bookType={bookType}
                  compact={true}
                />
              </div>
            )}
          </div>
        )}

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

        {/* Rating Action */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsRatingModalOpen(true)}
            className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {book.cawpileRating ? 'Edit Rating' : 'Rate Book'}
          </button>
        </div>
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

    {/* CAWPILE Rating Modal */}
    <CawpileRatingModal
      isOpen={isRatingModalOpen}
      onClose={() => setIsRatingModalOpen(false)}
      bookId={book.id}
      bookType={bookType}
      bookTitle={displayTitle}
      initialRating={book.cawpileRating}
    />

    {/* Change Format Modal */}
    <ChangeFormatModal
      isOpen={isChangingFormat}
      onClose={() => setIsChangingFormat(false)}
      currentFormat={selectedFormat}
      bookTitle={displayTitle}
      onFormatChange={handleFormatChange}
    />

    {/* Mark Complete Modal */}
    {book.status === 'READING' && (
      <MarkCompleteModal
        isOpen={isMarkCompleteModalOpen}
        onClose={() => setIsMarkCompleteModalOpen(false)}
        book={{
          id: book.id,
          title: displayTitle,
          startDate: book.startDate,
        }}
        onComplete={handleMarkComplete}
      />
    )}

    {/* Mark DNF Modal */}
    {book.status === 'READING' && (
      <MarkDNFModal
        isOpen={isMarkDNFModalOpen}
        onClose={() => setIsMarkDNFModalOpen(false)}
        book={{
          id: book.id,
          title: displayTitle,
        }}
        onDNF={handleMarkDNF}
      />
    )}

    {/* Edit Book Modal */}
    <EditBookModal
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      book={{
        id: book.id,
        title: displayTitle,
        status: book.status,
        format: book.format,
        acquisitionMethod: book.acquisitionMethod,
        acquisitionOther: book.acquisitionOther,
        bookClubName: book.bookClubName,
        readathonName: book.readathonName,
        isReread: book.isReread,
        dnfReason: book.dnfReason,
        lgbtqRepresentation: book.lgbtqRepresentation,
        lgbtqDetails: book.lgbtqDetails,
        disabilityRepresentation: book.disabilityRepresentation,
        disabilityDetails: book.disabilityDetails,
        isNewAuthor: book.isNewAuthor,
        authorPoc: book.authorPoc,
        authorPocDetails: book.authorPocDetails,
      }}
    />
    </>
  )
}