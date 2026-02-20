'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface MarkCompleteModalProps {
  isOpen: boolean
  onClose: () => void
  book: {
    id: string
    title: string
    startDate: Date | null
  }
  onComplete: (bookId: string, finishDate: string) => Promise<void>
}

export default function MarkCompleteModal({
  isOpen,
  onClose,
  book,
  onComplete
}: MarkCompleteModalProps) {
  const [finishDate, setFinishDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set default date when modal opens
  useEffect(() => {
    if (isOpen) {
      // If book has a start date, default to that month
      if (book.startDate) {
        const startDate = new Date(book.startDate)
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
          setFinishDate(today.toISOString().split('T')[0])
        } else {
          setFinishDate(defaultDate.toISOString().split('T')[0])
        }
      } else {
        // No start date, default to today
        setFinishDate(new Date().toISOString().split('T')[0])
      }
    }
  }, [isOpen, book.startDate])

  const handleSubmit = async () => {
    if (!finishDate) return

    setIsSubmitting(true)
    try {
      await onComplete(book.id, finishDate)
      onClose()
    } catch (error) {
      console.error('Error marking book as complete:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const minDate = book.startDate 
    ? new Date(book.startDate).toISOString().split('T')[0]
    : undefined

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Mark as Completed
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Congratulations on finishing &ldquo;{book.title}&rdquo;!
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label 
                        htmlFor="finish-date" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        When did you finish reading?
                      </label>
                      <input
                        id="finish-date"
                        type="date"
                        value={finishDate}
                        onChange={(e) => setFinishDate(e.target.value)}
                        min={minDate}
                        max={maxDate}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                      />
                      {book.startDate && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Started on {new Date(book.startDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                        <p className="text-sm text-green-800 dark:text-green-200">
                          After marking as complete, you&rsquo;ll be prompted to rate this book.
                        </p>
                      </div>
                    </div>
                  </div>
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
                    disabled={!finishDate || isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Mark as Complete'}
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