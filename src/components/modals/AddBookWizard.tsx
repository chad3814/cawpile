"use client"

import { Fragment, useState, useEffect, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { AcquisitionMethod } from '@/types/book'
import type { SignedBookSearchResult } from '@/lib/search/types'
import { BookFormat } from '@prisma/client'
import Image from 'next/image'
import AcquisitionMethodField from '@/components/forms/AcquisitionMethodField'
import BookClubField from '@/components/forms/BookClubField'
import ReadathonField from '@/components/forms/ReadathonField'
import RereadField from '@/components/forms/RereadField'
import FormatMultiSelect from '@/components/forms/FormatMultiSelect'

interface AddBookWizardProps {
  isOpen: boolean
  onClose: () => void
  book: SignedBookSearchResult | null
  onComplete: () => void
}

type BookStatus = 'WANT_TO_READ' | 'READING' | 'COMPLETED'

interface BookFormData {
  status: BookStatus
  format: BookFormat[]
  startDate?: string
  finishDate?: string
  progress?: number
  didFinish?: boolean
  // New tracking fields
  acquisitionMethod?: AcquisitionMethod | null
  acquisitionOther?: string
  bookClubName?: string | null
  readathonName?: string | null
  isReread?: boolean
}

export default function AddBookWizard({ isOpen, onClose, book, onComplete }: AddBookWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<BookFormData>({
    status: 'WANT_TO_READ',
    format: [],
  })

  // Set default finish date when reaching completion step
  useEffect(() => {
    if (currentStep === 4 && formData.status === 'COMPLETED' && formData.didFinish === true && !formData.finishDate) {
      if (formData.startDate) {
        const startDate = new Date(formData.startDate)
        const today = new Date()

        // Use the start date's month and year, but today's day
        // Unless today is earlier in the month than the start date
        const defaultDate = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          Math.max(startDate.getDate(), Math.min(today.getDate(), new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()))
        )

        // If the default date is in the future, use today
        if (defaultDate > today) {
          setFormData(prev => ({ ...prev, finishDate: today.toISOString().split('T')[0] }))
        } else {
          setFormData(prev => ({ ...prev, finishDate: defaultDate.toISOString().split('T')[0] }))
        }
      } else {
        // No start date, default to today
        setFormData(prev => ({ ...prev, finishDate: new Date().toISOString().split('T')[0] }))
      }
    }
  }, [currentStep, formData.status, formData.didFinish, formData.startDate, formData.finishDate])

  const handleClose = useCallback(() => {
    setCurrentStep(1)
    setFormData({
      status: 'WANT_TO_READ',
      format: [],
    })
    onClose()
  }, [onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

  const getTotalSteps = () => {
    // Always have 2 steps now - basic info and tracking fields
    if (formData.status === 'WANT_TO_READ') return 2
    if (formData.status === 'READING') return 4  // Status, tracking, start date, progress
    if (formData.status === 'COMPLETED') return 4  // Status, tracking, start date, completion
    return 2
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
          signedResult: book,
          status: formData.status,
          format: formData.format,
          startDate: formData.startDate,
          finishDate: formData.finishDate,
          progress,
          // New tracking fields
          acquisitionMethod: formData.acquisitionMethod,
          acquisitionOther: formData.acquisitionOther,
          bookClubName: formData.bookClubName,
          readathonName: formData.readathonName,
          isReread: formData.isReread,
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
          <div className="fixed inset-0 modal-backdrop" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-6 text-left align-middle shadow-xl transition-all border border-border">
                <Dialog.Title as="div" className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold leading-6 text-card-foreground">
                    Add to Library
                  </h3>
                  <button
                    onClick={handleClose}
                    className="rounded-md p-1 hover:bg-muted transition-colors focus-ring"
                    title="Close"
                  >
                    <XMarkIcon className="h-5 w-5 text-muted-foreground" />
                  </button>
                </Dialog.Title>

                {/* Progress Indicator */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    {Array.from({ length: getTotalSteps() }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 ${i > 0 ? 'ml-2' : ''} rounded-full ${
                          i < currentStep ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Book Info */}
                <div className="flex space-x-3 mb-4 pb-4 border-b border-border">
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
                    <p className="text-sm font-semibold text-card-foreground truncate">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
                        <label className="text-sm font-semibold text-card-foreground">Reading Status</label>
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
                              <span className="text-sm text-card-foreground">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-card-foreground mb-2 block">
                          Format(s)
                        </label>
                        <FormatMultiSelect
                          selectedFormats={formData.format}
                          onChange={(formats) => setFormData({ ...formData, format: formats })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Tracking Fields (All statuses) */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <AcquisitionMethodField
                        value={formData.acquisitionMethod}
                        otherValue={formData.acquisitionOther}
                        onChange={(method, other) =>
                          setFormData({
                            ...formData,
                            acquisitionMethod: method,
                            acquisitionOther: other
                          })
                        }
                      />

                      <BookClubField
                        value={formData.bookClubName}
                        onChange={(name) => setFormData({ ...formData, bookClubName: name })}
                      />

                      <ReadathonField
                        value={formData.readathonName}
                        onChange={(name) => setFormData({ ...formData, readathonName: name })}
                      />

                      <RereadField
                        value={formData.isReread}
                        onChange={(value) => setFormData({ ...formData, isReread: value })}
                      />
                    </div>
                  )}

                  {/* Step 3: Start Date (Reading/Completed) */}
                  {currentStep === 3 && (formData.status === 'READING' || formData.status === 'COMPLETED') && (
                    <div>
                      <label className="text-sm font-semibold text-card-foreground">
                        When did you start reading?
                      </label>
                      <input
                        type="date"
                        value={formData.startDate || ''}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        title="Start Date"
                        className="mt-2 block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-card-foreground focus-ring"
                      />
                    </div>
                  )}

                  {/* Step 4: Progress (Reading) or Completion (Completed) */}
                  {currentStep === 4 && formData.status === 'READING' && (
                    <div>
                      <label className="text-sm font-semibold text-card-foreground">
                        Current Progress (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress || 0}
                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value, 10) })}
                        onFocus={(e) => e.target.select()}
                        title="Progress"
                        className="mt-2 block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-card-foreground focus-ring"
                      />
                    </div>
                  )}

                  {currentStep === 4 && formData.status === 'COMPLETED' && (
                    <div>
                      <label className="text-sm font-semibold text-card-foreground mb-2 block">
                        Did you finish reading this book?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="yes"
                            checked={formData.didFinish === true}
                            onChange={() => setFormData({ ...formData, didFinish: true })}
                            className="mr-2"
                          />
                          <span className="text-sm text-card-foreground">Yes, I finished it</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="no"
                            checked={formData.didFinish === false}
                            onChange={() => setFormData({ ...formData, didFinish: false })}
                            className="mr-2"
                          />
                          <span className="text-sm text-card-foreground">No, I did not finish (DNF)</span>
                        </label>
                      </div>

                      {formData.didFinish === true && (
                        <div className="mt-4">
                          <label className="text-sm font-semibold text-card-foreground">
                            When did you finish?
                          </label>
                          <input
                            type="date"
                            value={formData.finishDate || ''}
                            onChange={(e) => setFormData({ ...formData, finishDate: e.target.value })}
                            max={new Date().toISOString().split('T')[0]}
                            title="End Date"
                            className="mt-2 block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-card-foreground focus-ring"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2 text-sm font-medium text-card-foreground hover:bg-muted rounded-md transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <div className="ml-auto">
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting || (currentStep === 1 && formData.format.length === 0)}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                    >
                      {currentStep === getTotalSteps()
                        ? (isSubmitting ? 'Adding...' : 'Add Book')
                        : 'Next'}
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
