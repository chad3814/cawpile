"use client"

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { BookSearchResult } from '@/types/book'
import Image from 'next/image'

interface AddBookWizardProps {
  isOpen: boolean
  onClose: () => void
  book: BookSearchResult | null
  onComplete: () => void
}

type BookStatus = 'WANT_TO_READ' | 'READING' | 'COMPLETED'
type BookFormat = 'HARDCOVER' | 'PAPERBACK' | 'EBOOK' | 'AUDIOBOOK'

interface BookFormData {
  status: BookStatus
  format: BookFormat
  startDate?: string
  finishDate?: string
  progress?: number
  didFinish?: boolean
}

export default function AddBookWizard({ isOpen, onClose, book, onComplete }: AddBookWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<BookFormData>({
    status: 'WANT_TO_READ',
    format: 'PAPERBACK',
  })

  const getTotalSteps = () => {
    if (formData.status === 'WANT_TO_READ') return 1
    if (formData.status === 'READING') return 3
    if (formData.status === 'COMPLETED') return 3
    return 1
  }

  const handleNext = () => {
    if (currentStep < getTotalSteps()) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!book) return

    setIsSubmitting(true)

    try {
      // Calculate progress if needed
      let progress = 0
      if (formData.status === 'COMPLETED') {
        progress = 100
      } else if (formData.status === 'READING' && formData.progress) {
        progress = formData.progress
      }

      const response = await fetch('/api/user/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleBooksId: book.googleId,
          status: formData.status,
          format: formData.format,
          startDate: formData.startDate,
          finishDate: formData.finishDate,
          progress,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add book')
      }

      onComplete()
      handleClose()
    } catch (error) {
      console.error('Error adding book:', error)
      // In production, show error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setCurrentStep(1)
    setFormData({
      status: 'WANT_TO_READ',
      format: 'PAPERBACK',
    })
    onClose()
  }

  if (!book) return null

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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="div" className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Add to Library
                  </h3>
                  <button
                    onClick={handleClose}
                    className="rounded-md p-1 hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </Dialog.Title>

                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    {Array.from({ length: getTotalSteps() }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 ${i > 0 ? 'ml-2' : ''} rounded-full ${
                          i < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Book Info */}
                <div className="flex space-x-3 mb-4 pb-4 border-b">
                  {book.imageUrl && (
                    <Image
                      src={book.imageUrl}
                      alt={book.title}
                      width={40}
                      height={60}
                      className="rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {book.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {book.authors.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Step Content */}
                <div className="mb-6">
                  {/* Step 1: Status & Format */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Reading Status</label>
                        <div className="mt-2 space-y-2">
                          {[
                            { value: 'WANT_TO_READ', label: 'Want to Read' },
                            { value: 'READING', label: 'Currently Reading' },
                            { value: 'COMPLETED', label: 'Completed' },
                          ].map((option) => (
                            <label key={option.value} className="flex items-center">
                              <input
                                type="radio"
                                value={option.value}
                                checked={formData.status === option.value}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as BookStatus })}
                                className="mr-2"
                              />
                              <span className="text-sm">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Format</label>
                        <div className="mt-2 space-y-2">
                          {[
                            { value: 'HARDCOVER', label: 'Hardcover' },
                            { value: 'PAPERBACK', label: 'Paperback' },
                            { value: 'EBOOK', label: 'E-book' },
                            { value: 'AUDIOBOOK', label: 'Audiobook' },
                          ].map((option) => (
                            <label key={option.value} className="flex items-center">
                              <input
                                type="radio"
                                value={option.value}
                                checked={formData.format === option.value}
                                onChange={(e) => setFormData({ ...formData, format: e.target.value as BookFormat })}
                                className="mr-2"
                              />
                              <span className="text-sm">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Start Date (Reading/Completed) */}
                  {currentStep === 2 && (formData.status === 'READING' || formData.status === 'COMPLETED') && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        When did you start reading?
                      </label>
                      <input
                        type="date"
                        value={formData.startDate || ''}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Step 3: Progress (Reading) or Completion (Completed) */}
                  {currentStep === 3 && formData.status === 'READING' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Current Progress (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={formData.progress || 0}
                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                        className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter your progress as a percentage (0-99)
                      </p>
                    </div>
                  )}

                  {currentStep === 3 && formData.status === 'COMPLETED' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Did you finish the book?
                        </label>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="yes"
                              checked={formData.didFinish === true}
                              onChange={() => setFormData({ ...formData, didFinish: true })}
                              className="mr-2"
                            />
                            <span className="text-sm">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              value="no"
                              checked={formData.didFinish === false}
                              onChange={() => setFormData({ ...formData, didFinish: false })}
                              className="mr-2"
                            />
                            <span className="text-sm">No (DNF)</span>
                          </label>
                        </div>
                      </div>

                      {formData.didFinish && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Finish Date
                          </label>
                          <input
                            type="date"
                            value={formData.finishDate || ''}
                            onChange={(e) => setFormData({ ...formData, finishDate: e.target.value })}
                            min={formData.startDate}
                            max={new Date().toISOString().split('T')[0]}
                            className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </span>
                    ) : currentStep === getTotalSteps() ? (
                      'Add Book'
                    ) : (
                      'Next'
                    )}
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