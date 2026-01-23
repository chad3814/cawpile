'use client'

import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { downloadExport } from '@/lib/export/downloadExport'

interface DataPrivacySectionProps {
  onError: (message: string) => void
}

export default function DataPrivacySection({ onError }: DataPrivacySectionProps) {
  const [isExportingJson, setIsExportingJson] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)

  const isExporting = isExportingJson || isExportingCsv

  const handleJsonExport = async () => {
    setIsExportingJson(true)
    try {
      await downloadExport('json')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to export data as JSON')
    } finally {
      setIsExportingJson(false)
    }
  }

  const handleCsvExport = async () => {
    setIsExportingCsv(true)
    try {
      await downloadExport('csv')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to export data as CSV')
    } finally {
      setIsExportingCsv(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-start space-x-3">
        <ArrowDownTrayIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Data & Privacy
          </h2>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your data belongs to you
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download a complete backup of your Cawpile data, including your profile, library,
            ratings, reading sessions, book clubs, and readathons. JSON format is best for
            re-importing, while CSV format works well with spreadsheet applications.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleJsonExport}
              disabled={isExporting}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingJson ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download as JSON
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCsvExport}
              disabled={isExporting}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingCsv ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download as CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
