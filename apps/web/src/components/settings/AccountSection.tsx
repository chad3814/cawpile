'use client'

import { useState } from 'react'
import DeleteAccountModal from './DeleteAccountModal'
import DataPrivacySection from './DataPrivacySection'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface AccountSectionProps {
  email: string
  onError: (message: string) => void
}

export default function AccountSection({ email, onError }: AccountSectionProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  return (
    <>
      {/* Account Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Account Information
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <p className="text-sm text-gray-900 dark:text-gray-100">{email}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Managed by your Google account
          </p>
        </div>
      </div>

      {/* Data & Privacy */}
      <DataPrivacySection onError={onError} />

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-red-200 dark:border-red-800 p-6">
        <div className="flex items-start space-x-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-lg font-medium text-red-700 dark:text-red-400 mb-2">
              Danger Zone
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-4 mb-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                Deleting your account will permanently remove:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1">
                <li>Your profile and personal information</li>
                <li>All books in your library</li>
                <li>All CAWPILE ratings and reviews</li>
                <li>Reading sessions and progress tracking</li>
                <li>Book clubs and readathon history</li>
                <li>Shared review links</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onError={onError}
      />
    </>
  )
}
