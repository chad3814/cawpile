'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import TrackingDetailsDisplay from '@/components/book/TrackingDetailsDisplay'
import Image from 'next/image'
import { BookStatus, BookFormat } from '@prisma/client'
import StarRating from '@/components/rating/StarRating'

interface BookDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  book: {
    title: string
    authors: string[]
    status: BookStatus
    format: BookFormat
    progress: number
    startDate: Date | null
    finishDate: Date | null
    imageUrl?: string | null
    description?: string | null
    pageCount?: number | null
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
    cawpileRating?: {
      average: number
    } | null
  }
}

const statusLabels = {
  WANT_TO_READ: 'Want to Read',
  READING: 'Reading',
  COMPLETED: 'Completed',
  DNF: 'Did Not Finish'
}

const formatLabels = {
  HARDCOVER: 'Hardcover',
  PAPERBACK: 'Paperback',
  EBOOK: 'E-book',
  AUDIOBOOK: 'Audiobook'
}

export default function BookDetailsModal({
  isOpen,
  onClose,
  book
}: BookDetailsModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Book Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Book Cover */}
                  <div className="md:col-span-1">
                    {book.imageUrl ? (
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={book.imageUrl}
                          alt={book.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/4] rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                  </div>

                  {/* Book Information */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {book.title}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        by {book.authors.join(', ')}
                      </p>
                    </div>

                    {/* Rating */}
                    {book.cawpileRating && (
                      <div>
                        <StarRating rating={book.cawpileRating.average} size="lg" />
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {statusLabels[book.status]}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Format</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatLabels[book.format]}
                        </p>
                      </div>
                      {book.pageCount && (
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Pages</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {book.pageCount}
                          </p>
                        </div>
                      )}
                      {book.status === 'READING' && (
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {book.progress}%
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      {book.startDate && (
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Started</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {new Date(book.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {book.finishDate && (
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Finished</span>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {new Date(book.finishDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {book.description && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          Description
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                          {book.description}
                        </p>
                      </div>
                    )}

                    {/* Tracking Details */}
                    <TrackingDetailsDisplay
                      acquisitionMethod={book.acquisitionMethod}
                      acquisitionOther={book.acquisitionOther}
                      bookClubName={book.bookClubName}
                      readathonName={book.readathonName}
                      isReread={book.isReread}
                      dnfReason={book.dnfReason}
                      lgbtqRepresentation={book.lgbtqRepresentation}
                      lgbtqDetails={book.lgbtqDetails}
                      disabilityRepresentation={book.disabilityRepresentation}
                      disabilityDetails={book.disabilityDetails}
                      isNewAuthor={book.isNewAuthor}
                      authorPoc={book.authorPoc}
                      authorPocDetails={book.authorPocDetails}
                    />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}