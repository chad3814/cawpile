'use client'

import { Fragment, useState, useEffect, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  FilmIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import type { MonthlyRecapExport, MonthlyRecapPreview } from '@/lib/recap/types'
import { MONTH_NAMES } from '@/lib/recap/types'

interface MonthlyRecapModalProps {
  isOpen: boolean
  onClose: () => void
  initialYear?: number
}

type RenderStatus = 'idle' | 'loading' | 'rendering' | 'success' | 'error'

export default function MonthlyRecapModal({
  isOpen,
  onClose,
  initialYear,
}: MonthlyRecapModalProps) {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(
    initialYear || currentDate.getFullYear()
  )
  const [preview, setPreview] = useState<MonthlyRecapPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [exportData, setExportData] = useState<MonthlyRecapExport | null>(null)

  // Generate year options (5 years back from current year)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentDate.getFullYear() - i)

  // Fetch preview when month/year changes
  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/recap/monthly?month=${selectedMonth}&year=${selectedYear}&preview=true`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch preview')
      }

      const data: MonthlyRecapPreview = await response.json()
      setPreview(data)
    } catch (err) {
      console.error('Error fetching preview:', err)
      setError('Failed to load preview')
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (isOpen) {
      fetchPreview()
    }
  }, [isOpen, fetchPreview])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRenderStatus('idle')
      setError(null)
      setExportData(null)
    }
  }, [isOpen])

  const handleExportJson = async () => {
    setRenderStatus('loading')
    setError(null)

    try {
      const response = await fetch(
        `/api/recap/monthly?month=${selectedMonth}&year=${selectedYear}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch recap data')
      }

      const data: MonthlyRecapExport = await response.json()
      setExportData(data)

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reading-recap-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setRenderStatus('success')
    } catch (err) {
      console.error('Error exporting recap:', err)
      setError(err instanceof Error ? err.message : 'Failed to export recap data')
      setRenderStatus('error')
    }
  }

  const handleGenerateVideo = async () => {
    setRenderStatus('rendering')
    setError(null)

    try {
      // First, fetch the full recap data if not already loaded
      let data = exportData
      if (!data) {
        const response = await fetch(
          `/api/recap/monthly?month=${selectedMonth}&year=${selectedYear}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch recap data')
        }

        data = await response.json()
        setExportData(data)
      }

      // Call the Remotion render server
      const videoResponse = await fetch('http://localhost:3001/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!videoResponse.ok) {
        const errorData = await videoResponse.json()
        throw new Error(errorData.message || 'Video render failed')
      }

      const result = await videoResponse.json()

      // Download the rendered video
      const downloadUrl = `http://localhost:3001/download/${result.filename}`
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setRenderStatus('success')
    } catch (err) {
      console.error('Error generating video:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to generate video'
      )
      setRenderStatus('error')
    }
  }

  const hasBooks = preview && preview.bookCount > 0

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
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Monthly Reading Recap
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    title="Close"
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Month/Year Selectors */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label
                      htmlFor="recap-month"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Month
                    </label>
                    <select
                      id="recap-month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    >
                      {MONTH_NAMES.map((name, index) => (
                        <option key={name} value={index + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="recap-year"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Year
                    </label>
                    <select
                      id="recap-year"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview Stats */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {previewLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
                    </div>
                  ) : preview ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {preview.monthName} {preview.year}
                      </h4>
                      {preview.bookCount > 0 ? (
                        <>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {preview.bookCount}
                            </span>{' '}
                            {preview.bookCount === 1 ? 'book' : 'books'} finished
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {preview.completedCount > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                {preview.completedCount} completed
                              </span>
                            )}
                            {preview.dnfCount > 0 && (
                              <span className="flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                                {preview.dnfCount} DNF
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No books finished this month
                        </p>
                      )}
                    </div>
                  ) : error ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  ) : null}
                </div>

                {/* Status Messages */}
                {renderStatus === 'rendering' && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Generating video...
                      </p>
                    </div>
                  </div>
                )}

                {renderStatus === 'success' && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Export completed successfully!
                    </p>
                  </div>
                )}

                {error && renderStatus !== 'idle' && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGenerateVideo}
                    disabled={!hasBooks || renderStatus === 'rendering'}
                    className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-orange-600 px-4 py-3 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FilmIcon className="h-5 w-5 mr-2" />
                    Generate TikTok Video
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    disabled={!hasBooks || renderStatus === 'loading'}
                    className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Export JSON Data
                  </button>
                </div>

                {/* Help Text */}
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Generate a TikTok-style video showcasing your monthly reading progress,
                  or export raw data for custom video creation.
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
