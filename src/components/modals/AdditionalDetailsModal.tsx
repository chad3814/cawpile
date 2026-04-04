'use client'

import { Fragment, useState, useEffect, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import RepresentationField from '@/components/forms/RepresentationField'
import AuthorPocField from '@/components/forms/AuthorPocField'
import NewAuthorField from '@/components/forms/NewAuthorField'
import { RepresentationValue } from '@/types/book'

interface AdditionalDetailsData {
  lgbtqRepresentation?: RepresentationValue | null
  lgbtqDetails?: string | null
  disabilityRepresentation?: RepresentationValue | null
  disabilityDetails?: string | null
  isNewAuthor?: boolean | null
  authorPoc?: RepresentationValue | null
  authorPocDetails?: string | null
}

interface AdditionalDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  userBookId: string
  bookTitle: string
  initialData?: AdditionalDetailsData
  onSave: (data: AdditionalDetailsData) => Promise<void>
  onReview: () => void
}

export default function AdditionalDetailsModal({
  isOpen,
  onClose,
  userBookId,
  bookTitle,
  initialData,
  onSave,
  onReview
}: AdditionalDetailsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSuggestions, setHasSuggestions] = useState(false)

  // Form data
  const [lgbtqRepresentation, setLgbtqRepresentation] = useState<RepresentationValue | ''>('')
  const [lgbtqDetails, setLgbtqDetails] = useState('')
  const [disabilityRepresentation, setDisabilityRepresentation] = useState<RepresentationValue | ''>('')
  const [disabilityDetails, setDisabilityDetails] = useState('')
  const [isNewAuthor, setIsNewAuthor] = useState<boolean | null>(null)
  const [authorPoc, setAuthorPoc] = useState<RepresentationValue | ''>('')
  const [authorPocDetails, setAuthorPocDetails] = useState('')

  const clearSuggestions = useCallback(() => {
    setLgbtqRepresentation('')
    setLgbtqDetails('')
    setDisabilityRepresentation('')
    setDisabilityDetails('')
    setIsNewAuthor(null)
    setAuthorPoc('')
    setAuthorPocDetails('')
    setHasSuggestions(false)
  }, [])

  // Initialize form state from initialData only when the modal opens.
  // Intentionally excludes initialData and userBookId from deps —
  // re-initializing on every router.refresh() (which updates initialData
  // from the server) would wipe unsaved selections made before navigating
  // to the review modal and back.
  useEffect(() => {
    if (isOpen) {
      setLgbtqRepresentation(initialData?.lgbtqRepresentation ?? '')
      setLgbtqDetails(initialData?.lgbtqDetails ?? '')
      setDisabilityRepresentation(initialData?.disabilityRepresentation ?? '')
      setDisabilityDetails(initialData?.disabilityDetails ?? '')
      setIsNewAuthor(initialData?.isNewAuthor ?? null)
      setAuthorPoc(initialData?.authorPoc ?? '')
      setAuthorPocDetails(initialData?.authorPocDetails ?? '')
      setHasSuggestions(false)

      // Fetch smart defaults when all diversity fields are empty
      const hasExistingData = initialData?.lgbtqRepresentation
        || initialData?.disabilityRepresentation
        || initialData?.authorPoc
        || initialData?.isNewAuthor != null;

      if (!hasExistingData) {
        fetch(`/api/user/books/${userBookId}/diversity-defaults`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (!data?.defaults) return;
            const d = data.defaults;
            let applied = false;
            if (d.lgbtqRepresentation) {
              setLgbtqRepresentation(d.lgbtqRepresentation as RepresentationValue)
              if (d.lgbtqDetails) setLgbtqDetails(d.lgbtqDetails)
              applied = true;
            }
            if (d.disabilityRepresentation) {
              setDisabilityRepresentation(d.disabilityRepresentation as RepresentationValue)
              if (d.disabilityDetails) setDisabilityDetails(d.disabilityDetails)
              applied = true;
            }
            if (d.authorPoc) {
              setAuthorPoc(d.authorPoc as RepresentationValue)
              if (d.authorPocDetails) setAuthorPocDetails(d.authorPocDetails)
              applied = true;
            }
            if (d.isNewAuthor != null) {
              setIsNewAuthor(d.isNewAuthor)
              applied = true;
            }
            if (applied) setHasSuggestions(true);
          })
          .catch(() => { /* silently ignore - defaults are best-effort */ });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const data: AdditionalDetailsData = {
        lgbtqRepresentation: lgbtqRepresentation || undefined,
        lgbtqDetails: lgbtqRepresentation === RepresentationValue.Yes ? lgbtqDetails : undefined,
        disabilityRepresentation: disabilityRepresentation || undefined,
        disabilityDetails: disabilityRepresentation === RepresentationValue.Yes ? disabilityDetails : undefined,
        isNewAuthor: isNewAuthor ?? undefined,
        authorPoc: authorPoc || undefined,
        authorPocDetails: authorPoc === RepresentationValue.Yes ? authorPocDetails : undefined
      }

      await onSave(data)
    } catch (error) {
      console.error('Error saving additional details:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  const handleReviewClick = () => {
    onReview()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Additional Details
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Subtitle */}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Optional tracking for &ldquo;{bookTitle}&rdquo;
                </p>

                {/* Smart defaults banner */}
                {hasSuggestions && (
                  <div className="flex items-center justify-between mb-4 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
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

                {/* Form body - scrollable */}
                <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2">
                  {/* LGBTQ+ Representation */}
                  <RepresentationField
                    label="LGBTQ+ Representation"
                    description="Does this book include LGBTQ+ characters or themes?"
                    value={lgbtqRepresentation}
                    detailsValue={lgbtqDetails}
                    onValueChange={setLgbtqRepresentation}
                    onDetailsChange={setLgbtqDetails}
                    detailsPlaceholder="Describe the representation (e.g., main character is gay, includes trans side character)"
                    detailsMaxLength={500}
                  />

                  {/* Disability Representation */}
                  <RepresentationField
                    label="Disability Representation"
                    description="Does this book include disabled characters or disability themes?"
                    value={disabilityRepresentation}
                    detailsValue={disabilityDetails}
                    onValueChange={setDisabilityRepresentation}
                    onDetailsChange={setDisabilityDetails}
                    detailsPlaceholder="Describe the representation (e.g., protagonist uses wheelchair, autism representation)"
                    detailsMaxLength={500}
                  />

                  {/* New Author */}
                  <NewAuthorField
                    value={isNewAuthor}
                    onChange={setIsNewAuthor}
                  />

                  {/* Author POC */}
                  <AuthorPocField
                    value={authorPoc}
                    detailsValue={authorPocDetails}
                    onValueChange={setAuthorPoc}
                    onDetailsChange={setAuthorPocDetails}
                  />
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-between items-center">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                    onClick={handleReviewClick}
                  >
                    Review
                  </button>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                      onClick={handleClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSave}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
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
