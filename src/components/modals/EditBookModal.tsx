'use client'

import { Fragment, useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline'
import AcquisitionMethodField from '@/components/forms/AcquisitionMethodField'
import BookClubField from '@/components/forms/BookClubField'
import ReadathonField from '@/components/forms/ReadathonField'
import RereadField from '@/components/forms/RereadField'
import RepresentationField from '@/components/forms/RepresentationField'
import AuthorPocField from '@/components/forms/AuthorPocField'
import NewAuthorField from '@/components/forms/NewAuthorField'
import FormatMultiSelect from '@/components/forms/FormatMultiSelect'
import { BookStatus, BookFormat } from '@prisma/client'
import { AcquisitionMethod, RepresentationValue, BookTrackingData } from '@/types/book'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface EditionWithProviders {
  hardcoverBook?: {
    imageUrl: string | null
  } | null
  googleBook?: {
    imageUrl: string | null
  } | null
  ibdbBook?: {
    imageUrl: string | null
  } | null
}

interface EditBookModalProps {
  isOpen: boolean
  onClose: () => void
  book: {
    id: string
    title: string
    status: BookStatus
    format: BookFormat[]
    finishDate?: Date | null
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
    preferredCoverProvider?: string | null
  }
  edition?: EditionWithProviders
}

type CoverProvider = 'hardcover' | 'google' | 'ibdb'

export default function EditBookModal({
  isOpen,
  onClose,
  book,
  edition
}: EditBookModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'basic' | 'tracking' | 'additional' | 'cover'>('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Basic fields
  const [status, setStatus] = useState(book.status)
  const [format, setFormat] = useState<BookFormat[]>(Array.isArray(book.format) ? book.format : [book.format])
  const [dnfReason, setDnfReason] = useState(book.dnfReason || '')
  const [dnfDate, setDnfDate] = useState(
    book.finishDate && book.status === BookStatus.DNF
      ? new Date(book.finishDate).toISOString().split('T')[0]
      : ''
  )
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

  // Cover preference
  const [preferredCoverProvider, setPreferredCoverProvider] = useState<CoverProvider | null>(
    (book.preferredCoverProvider as CoverProvider) || null
  )

  // Smart defaults for additional details
  const [hasSuggestions, setHasSuggestions] = useState(false)
  const defaultsFetchedRef = useRef(false)
  const suggestedFieldsRef = useRef(new Set<string>())

  const clearSuggestions = useCallback(() => {
    const fields = suggestedFieldsRef.current;
    if (fields.has('lgbtqRepresentation')) {
      setLgbtqRepresentation('')
      setLgbtqDetails('')
    }
    if (fields.has('disabilityRepresentation')) {
      setDisabilityRepresentation('')
      setDisabilityDetails('')
    }
    if (fields.has('isNewAuthor')) setIsNewAuthor(null)
    if (fields.has('authorPoc')) {
      setAuthorPoc('')
      setAuthorPocDetails('')
    }
    suggestedFieldsRef.current = new Set()
    setHasSuggestions(false)
  }, [])

  // Fetch smart defaults when switching to the additional tab with empty fields
  useEffect(() => {
    if (activeTab !== 'additional' || defaultsFetchedRef.current) return;
    defaultsFetchedRef.current = true;

    const hasExistingData = book.lgbtqRepresentation
      || book.disabilityRepresentation
      || book.authorPoc
      || book.isNewAuthor != null;
    if (hasExistingData) return;

    const controller = new AbortController();
    fetch(`/api/user/books/${book.id}/diversity-defaults`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.defaults) return;
        const d = data.defaults;
        const suggested = new Set<string>();
        if (d.lgbtqRepresentation) {
          setLgbtqRepresentation(d.lgbtqRepresentation as RepresentationValue);
          if (d.lgbtqDetails) setLgbtqDetails(d.lgbtqDetails);
          suggested.add('lgbtqRepresentation');
        }
        if (d.disabilityRepresentation) {
          setDisabilityRepresentation(d.disabilityRepresentation as RepresentationValue);
          if (d.disabilityDetails) setDisabilityDetails(d.disabilityDetails);
          suggested.add('disabilityRepresentation');
        }
        if (d.authorPoc) {
          setAuthorPoc(d.authorPoc as RepresentationValue);
          if (d.authorPocDetails) setAuthorPocDetails(d.authorPocDetails);
          suggested.add('authorPoc');
        }
        if (d.isNewAuthor != null) {
          setIsNewAuthor(d.isNewAuthor);
          suggested.add('isNewAuthor');
        }
        if (suggested.size > 0) {
          suggestedFieldsRef.current = suggested;
          setHasSuggestions(true);
        }
      })
      .catch(err => { if (err.name !== 'AbortError') { /* silently ignore */ } });
    return () => controller.abort();
  }, [activeTab, book.id, book.lgbtqRepresentation, book.disabilityRepresentation, book.authorPoc, book.isNewAuthor])

  // Clear DNF reason and set default date when status changes to DNF
  useEffect(() => {
    if (status === BookStatus.DNF && !dnfDate) {
      // Default to today's date
      setDnfDate(new Date().toISOString().split('T')[0])
    }
    if (status !== BookStatus.DNF) {
      setDnfReason('')
    }
  }, [status, dnfDate])

  // Get available covers from edition
  const availableCovers: { provider: CoverProvider; imageUrl: string }[] = []
  if (edition?.hardcoverBook?.imageUrl) {
    availableCovers.push({ provider: 'hardcover', imageUrl: edition.hardcoverBook.imageUrl })
  }
  if (edition?.googleBook?.imageUrl) {
    availableCovers.push({ provider: 'google', imageUrl: edition.googleBook.imageUrl })
  }
  if (edition?.ibdbBook?.imageUrl) {
    availableCovers.push({ provider: 'ibdb', imageUrl: edition.ibdbBook.imageUrl })
  }

  // Determine which cover is currently selected (either preferred or default)
  const getSelectedProvider = (): CoverProvider | null => {
    if (preferredCoverProvider && availableCovers.some(c => c.provider === preferredCoverProvider)) {
      return preferredCoverProvider
    }
    // Default to first available (hardcover > google > ibdb order)
    if (availableCovers.length > 0) {
      return availableCovers[0].provider
    }
    return null
  }

  const handleCoverSelect = (provider: CoverProvider) => {
    // If clicking the same provider that's already default (first available), clear preference
    if (preferredCoverProvider === null && availableCovers[0]?.provider === provider) {
      return // Already showing this one by default
    }
    // If clicking the currently preferred provider, keep it selected
    // If clicking a different provider, set it as preferred
    setPreferredCoverProvider(provider)
  }

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
          finishDate: status === BookStatus.DNF && dnfDate ? dnfDate : undefined,
          notes: notes || undefined,
          preferredCoverProvider,
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

  const maxDate = new Date().toISOString().split('T')[0]

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
                    <button
                      onClick={() => setActiveTab('cover')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'cover'
                          ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Cover
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
                        <>
                          <div>
                            <label htmlFor="dnf-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              When did you stop reading?
                            </label>
                            <input
                              id="dnf-date"
                              type="date"
                              value={dnfDate}
                              onChange={(e) => setDnfDate(e.target.value)}
                              max={maxDate}
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                          </div>

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
                        </>
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Book Format(s)
                        </label>
                        <FormatMultiSelect
                          selectedFormats={format}
                          onChange={setFormat}
                        />
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
                      {hasSuggestions && (
                        <div className="flex items-center justify-between px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                            <SparklesIcon className="h-4 w-4 flex-shrink-0" />
                            <span>Pre-filled from previous reviews</span>
                          </div>
                          <button
                            type="button"
                            onClick={clearSuggestions}
                            className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 underline"
                          >
                            Clear
                          </button>
                        </div>
                      )}
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

                  {activeTab === 'cover' && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Cover Image
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Choose which cover image to display for this book in your library.
                        </p>

                        {availableCovers.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="mx-auto w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center mb-3">
                              <svg
                                className="w-8 h-10 text-gray-400 dark:text-gray-500"
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
                            <p className="text-gray-500 dark:text-gray-400">
                              No cover images available for this book.
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4">
                            {availableCovers.map(({ provider, imageUrl }) => {
                              const isSelected = getSelectedProvider() === provider
                              const isPreferred = preferredCoverProvider === provider

                              return (
                                <button
                                  key={provider}
                                  type="button"
                                  onClick={() => handleCoverSelect(provider)}
                                  className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                                    isSelected
                                      ? 'border-orange-500 ring-2 ring-orange-500 ring-offset-2 dark:ring-offset-gray-800'
                                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                  }`}
                                >
                                  <Image
                                    src={imageUrl}
                                    alt={`Cover from ${provider}`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 33vw, 200px"
                                  />
                                  {isSelected && (
                                    <div className="absolute top-2 right-2 bg-orange-500 rounded-full p-1">
                                      <CheckIcon className="w-4 h-4 text-white" />
                                    </div>
                                  )}
                                  {isPreferred && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-orange-500/90 text-white text-xs py-1 text-center">
                                      Selected
                                    </div>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
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
