"use client"

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface UpdateProgressModalProps {
  isOpen: boolean
  onClose: () => void
  book: {
    id: string
    title: string
    currentProgress: number
    pageCount?: number | null
  }
  onUpdate: (bookId: string, progress: number) => Promise<void>
}

type ProgressType = 'percentage' | 'pages' | 'time'

export default function UpdateProgressModal({ 
  isOpen, 
  onClose, 
  book,
  onUpdate 
}: UpdateProgressModalProps) {
  const [progressType, setProgressType] = useState<ProgressType>('percentage')
  const [progressValue, setProgressValue] = useState(book.currentProgress.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const calculatePercentage = (): number => {
    if (progressType === 'percentage') {
      return Math.min(100, Math.max(0, parseInt(progressValue) || 0))
    }
    
    if (progressType === 'pages' && book.pageCount) {
      const pages = parseInt(progressValue) || 0
      return Math.min(100, Math.max(0, (pages / book.pageCount) * 100))
    }
    
    // For time, assume average reading speed of 250 words/min, ~1 page/min
    if (progressType === 'time' && book.pageCount) {
      const minutes = parseInt(progressValue) || 0
      return Math.min(100, Math.max(0, (minutes / book.pageCount) * 100))
    }
    
    return 0
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const percentage = calculatePercentage()
      await onUpdate(book.id, percentage)
      onClose()
    } catch (error) {
      console.error('Error updating progress:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setProgressValue(book.currentProgress.toString())
    setProgressType('percentage')
    onClose()
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
                    Update Progress
                  </h3>
                  <button
                    onClick={handleClose}
                    className="rounded-md p-1 hover:bg-muted transition-colors focus-ring"
                  >
                    <XMarkIcon className="h-5 w-5 text-muted-foreground" />
                  </button>
                </Dialog.Title>

                <div className="mb-4">
                  <p className="text-sm font-medium text-card-foreground mb-2">{book.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Current progress: {Math.round(book.currentProgress)}%
                  </p>
                </div>

                {/* Progress Type Selector */}
                <div className="mb-4">
                  <label className="text-sm font-semibold text-card-foreground">
                    Update using:
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setProgressType('percentage')}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors focus-ring ${
                        progressType === 'percentage'
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border text-card-foreground hover:bg-muted'
                      }`}
                    >
                      Percentage
                    </button>
                    <button
                      onClick={() => setProgressType('pages')}
                      disabled={!book.pageCount}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors focus-ring ${
                        progressType === 'pages'
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border text-card-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      Pages
                    </button>
                    <button
                      onClick={() => setProgressType('time')}
                      disabled={!book.pageCount}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors focus-ring ${
                        progressType === 'time'
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border text-card-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      Time
                    </button>
                  </div>
                </div>

                {/* Progress Input */}
                <div className="mb-4">
                  <label className="text-sm font-semibold text-card-foreground">
                    {progressType === 'percentage' && 'Progress (%)'}
                    {progressType === 'pages' && `Pages read (of ${book.pageCount || 'unknown'})`}
                    {progressType === 'time' && 'Minutes read'}
                  </label>
                  <input
                    type="number"
                    value={progressValue}
                    onChange={(e) => setProgressValue(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    min="0"
                    max={progressType === 'percentage' ? '100' : book.pageCount?.toString()}
                    className="mt-2 block w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-card-foreground focus-ring"
                  />
                  {progressType !== 'percentage' && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      This will be {Math.round(calculatePercentage())}% progress
                    </p>
                  )}
                </div>

                {/* Progress Preview */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>New Progress</span>
                    <span>{Math.round(calculatePercentage())}%</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${calculatePercentage()}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-secondary-foreground bg-secondary border border-border rounded-md hover:bg-accent transition-colors focus-ring"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors focus-ring"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Progress'}
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