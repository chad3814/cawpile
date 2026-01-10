'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import RepresentationField from '@/components/forms/RepresentationField'
import AuthorPocField from '@/components/forms/AuthorPocField'
import NewAuthorField from '@/components/forms/NewAuthorField'
import ReviewTextareaField from '@/components/forms/ReviewTextareaField'
import { RepresentationValue, AdditionalDetailsData } from '@/types/book'

interface AdditionalDetailsWizardProps {
  isOpen: boolean
  onClose: () => void
  bookTitle: string
  onSave: (data: AdditionalDetailsData) => Promise<void>
  initialReview?: string
}

export default function AdditionalDetailsWizard({
  isOpen,
  onClose,
  bookTitle,
  onSave,
  initialReview = ''
}: AdditionalDetailsWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [lgbtqRepresentation, setLgbtqRepresentation] = useState<RepresentationValue | ''>('')
  const [lgbtqDetails, setLgbtqDetails] = useState('')
  const [disabilityRepresentation, setDisabilityRepresentation] = useState<RepresentationValue | ''>('')
  const [disabilityDetails, setDisabilityDetails] = useState('')
  const [isNewAuthor, setIsNewAuthor] = useState<boolean | null>(null)
  const [authorPoc, setAuthorPoc] = useState<RepresentationValue | ''>('')
  const [authorPocDetails, setAuthorPocDetails] = useState('')
  const [review, setReview] = useState(initialReview)

  const totalSteps = 5

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkipAll = () => {
    onClose()
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      const data: AdditionalDetailsData = {
        lgbtqRepresentation: lgbtqRepresentation || undefined,
        lgbtqDetails: lgbtqRepresentation === RepresentationValue.Yes ? lgbtqDetails : undefined,
        disabilityRepresentation: disabilityRepresentation || undefined,
        disabilityDetails: disabilityRepresentation === RepresentationValue.Yes ? disabilityDetails : undefined,
        isNewAuthor: isNewAuthor ?? undefined,
        authorPoc: authorPoc || undefined,
        authorPocDetails: authorPoc === RepresentationValue.Yes ? authorPocDetails : undefined,
        review: review.trim() || undefined
      }

      await onSave(data)
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error saving additional details:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setLgbtqRepresentation('')
    setLgbtqDetails('')
    setDisabilityRepresentation('')
    setDisabilityDetails('')
    setIsNewAuthor(null)
    setAuthorPoc('')
    setAuthorPocDetails('')
    setReview('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
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
        )
      case 2:
        return (
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
        )
      case 3:
        return (
          <NewAuthorField
            value={isNewAuthor}
            onChange={setIsNewAuthor}
          />
        )
      case 4:
        return (
          <AuthorPocField
            value={authorPoc}
            detailsValue={authorPocDetails}
            onValueChange={setAuthorPoc}
            onDetailsChange={setAuthorPocDetails}
          />
        )
      case 5:
        return (
          <ReviewTextareaField
            value={review}
            onChange={setReview}
          />
        )
      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'LGBTQ+ Representation'
      case 2:
        return 'Disability Representation'
      case 3:
        return 'New Author'
      case 4:
        return 'Author Diversity'
      case 5:
        return 'Review'
      default:
        return ''
    }
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

                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Optional tracking for &ldquo;{bookTitle}&rdquo;
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Step {currentStep} of {totalSteps}
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {getStepTitle()}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div
                      className="h-2 bg-orange-600 rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  {renderStep()}
                </div>

                <div className="mt-6 flex justify-between">
                  <div>
                    {currentStep === 1 && (
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                        onClick={handleSkipAll}
                      >
                        Skip All
                      </button>
                    )}
                    {currentStep > 1 && (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                        onClick={handlePrevious}
                      >
                        <ChevronLeftIcon className="h-4 w-4 mr-1" />
                        Previous
                      </button>
                    )}
                  </div>

                  <div>
                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                        onClick={handleNext}
                      >
                        Next
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                        onClick={handleComplete}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Complete'}
                      </button>
                    )}
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
