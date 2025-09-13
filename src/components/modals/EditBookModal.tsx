'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import AcquisitionMethodField from '@/components/forms/AcquisitionMethodField'
import BookClubField from '@/components/forms/BookClubField'
import ReadathonField from '@/components/forms/ReadathonField'
import RereadField from '@/components/forms/RereadField'
import RepresentationField from '@/components/forms/RepresentationField'
import AuthorPocField from '@/components/forms/AuthorPocField'
import NewAuthorField from '@/components/forms/NewAuthorField'
import { BookStatus, BookFormat } from '@prisma/client'
import { AcquisitionMethod, RepresentationValue, BookTrackingData } from '@/types/book'
import { useRouter } from 'next/navigation'

interface EditBookModalProps {
  isOpen: boolean
  onClose: () => void
  book: {
    id: string
    title: string
    status: BookStatus
    format: BookFormat
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
    notes?: string | null
  }
}

export default function EditBookModal({
  isOpen,
  onClose,
  book
}: EditBookModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'basic' | 'tracking' | 'additional'>('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Basic fields
  const [status, setStatus] = useState(book.status)
  const [format, setFormat] = useState(book.format)
  const [dnfReason, setDnfReason] = useState(book.dnfReason || '')
  const [notes, setNotes] = useState(book.notes || '')

  // Tracking fields
  const [acquisitionMethod, setAcquisitionMethod] = useState<AcquisitionMethod | ''>(
    (book.acquisitionMethod as AcquisitionMethod) || ''
  )
  const [acquisitionOther, setAcquisitionOther] = useState(book.acquisitionOther || '')
  const [bookClubName, setBookClubName] = useState(book.bookClubName || '')
  const [readathonName, setReadathonName] = useState(book.readathonName || '')
  const [isReread, setIsReread] = useState(book.isReread || false)

  // Additional details fields
  const [lgbtqRepresentation, setLgbtqRepresentation] = useState<RepresentationValue | ''>(
    (book.lgbtqRepresentation as RepresentationValue) || ''
  )
  const [lgbtqDetails, setLgbtqDetails] = useState(book.lgbtqDetails || '')
  const [disabilityRepresentation, setDisabilityRepresentation] = useState<RepresentationValue | ''>(
    (book.disabilityRepresentation as RepresentationValue) || ''
  )
  const [disabilityDetails, setDisabilityDetails] = useState(book.disabilityDetails || '')
  const [isNewAuthor, setIsNewAuthor] = useState<boolean | null>(book.isNewAuthor ?? null)
  const [authorPoc, setAuthorPoc] = useState<RepresentationValue | ''>(
    (book.authorPoc as RepresentationValue) || ''
  )
  const [authorPocDetails, setAuthorPocDetails] = useState(book.authorPocDetails || '')

  // Clear DNF reason if status changes from DNF
  useEffect(() => {
    if (status !== BookStatus.DNF) {
      setDnfReason('')
    }
  }, [status])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const trackingData: BookTrackingData = {
        acquisitionMethod: acquisitionMethod || undefined,
        acquisitionOther: acquisitionMethod === AcquisitionMethod.Other ? acquisitionOther : undefined,
        bookClubName: bookClubName || undefined,
        readathonName: readathonName || undefined,
        isReread: isReread || undefined
      }

      const additionalData = {
        lgbtqRepresentation: lgbtqRepresentation || undefined,
        lgbtqDetails: lgbtqRepresentation === RepresentationValue.Yes ? lgbtqDetails : undefined,
        disabilityRepresentation: disabilityRepresentation || undefined,
        disabilityDetails: disabilityRepresentation === RepresentationValue.Yes ? disabilityDetails : undefined,
        isNewAuthor: isNewAuthor ?? undefined,
        authorPoc: authorPoc || undefined,
        authorPocDetails: authorPoc === RepresentationValue.Yes ? authorPocDetails : undefined
      }

      const response = await fetch(`/api/user/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          format,
          dnfReason: status === BookStatus.DNF ? dnfReason : undefined,
          notes: notes || undefined,
          ...trackingData,
          ...additionalData
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update book')
      }

      router.refresh()
      onClose()
    } catch (error) {
      console.error('Error updating book:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Edit Book Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Editing &ldquo;{book.title}&rdquo;
                  </p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('basic')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'basic'
                          ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Basic Info
                    </button>
                    <button
                      onClick={() => setActiveTab('tracking')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'tracking'
                          ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Tracking
                    </button>
                    <button
                      onClick={() => setActiveTab('additional')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'additional'
                          ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Additional Details
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {activeTab === 'basic' && (
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reading Status
                        </label>
                        <select
                          id="status"
                          value={status}
                          onChange={(e) => setStatus(e.target.value as BookStatus)}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                        >
                          <option value={BookStatus.WANT_TO_READ}>Want to Read</option>
                          <option value={BookStatus.READING}>Reading</option>
                          <option value={BookStatus.COMPLETED}>Completed</option>
                          <option value={BookStatus.DNF}>Did Not Finish</option>
                        </select>
                      </div>

                      {status === BookStatus.DNF && (
                        <div>
                          <label htmlFor="dnf-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            DNF Reason (optional)
                          </label>
                          <textarea
                            id="dnf-reason"
                            value={dnfReason}
                            onChange={(e) => setDnfReason(e.target.value)}
                            maxLength={500}
                            rows={4}
                            placeholder="Why did you not finish this book?"
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {dnfReason.length}/500 characters
                          </p>
                        </div>
                      )}

                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Notes
                        </label>
                        <textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          maxLength={2000}
                          rows={5}
                          placeholder="Add any personal notes about this book..."
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {notes.length}/2000 characters
                        </p>
                      </div>

                      <div>
                        <label htmlFor="format" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Book Format
                        </label>
                        <select
                          id="format"
                          value={format}
                          onChange={(e) => setFormat(e.target.value as BookFormat)}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                        >
                          <option value={BookFormat.HARDCOVER}>Hardcover</option>
                          <option value={BookFormat.PAPERBACK}>Paperback</option>
                          <option value={BookFormat.EBOOK}>E-book</option>
                          <option value={BookFormat.AUDIOBOOK}>Audiobook</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tracking' && (
                    <div className="space-y-6">
                      <AcquisitionMethodField
                        value={acquisitionMethod || null}
                        otherValue={acquisitionOther}
                        onChange={(method: AcquisitionMethod | null, other?: string) => {
                          setAcquisitionMethod(method || '')
                          if (other !== undefined) {
                            setAcquisitionOther(other)
                          }
                        }}
                      />

                      <BookClubField
                        value={bookClubName}
                        onChange={(value) => setBookClubName(value || '')}
                      />

                      <ReadathonField
                        value={readathonName}
                        onChange={(value) => setReadathonName(value || '')}
                      />

                      <RereadField
                        value={isReread}
                        onChange={setIsReread}
                      />
                    </div>
                  )}

                  {activeTab === 'additional' && (
                    <div className="space-y-6">
                      <RepresentationField
                        label="LGBTQ+ Representation"
                        description="Does this book include LGBTQ+ characters or themes?"
                        value={lgbtqRepresentation}
                        detailsValue={lgbtqDetails}
                        onValueChange={setLgbtqRepresentation}
                        onDetailsChange={setLgbtqDetails}
                        detailsPlaceholder="Describe the representation"
                        detailsMaxLength={500}
                      />

                      <RepresentationField
                        label="Disability Representation"
                        description="Does this book include disabled characters or disability themes?"
                        value={disabilityRepresentation}
                        detailsValue={disabilityDetails}
                        onValueChange={setDisabilityRepresentation}
                        onDetailsChange={setDisabilityDetails}
                        detailsPlaceholder="Describe the representation"
                        detailsMaxLength={500}
                      />

                      <NewAuthorField
                        value={isNewAuthor}
                        onChange={setIsNewAuthor}
                      />

                      <AuthorPocField
                        value={authorPoc}
                        detailsValue={authorPocDetails}
                        onValueChange={setAuthorPoc}
                        onDetailsChange={setAuthorPocDetails}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}