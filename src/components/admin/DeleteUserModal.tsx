'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface UserStats {
  booksCount: number
  sharedReviewsCount: number
}

interface DeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userEmail: string
  onConfirm: () => Promise<void>
}

export default function DeleteUserModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  onConfirm
}: DeleteUserModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch user stats when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      setIsLoadingStats(true)
      setError(null)

      fetch(`/api/admin/users/${userId}/stats`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch user stats')
          }
          return response.json()
        })
        .then((data: UserStats) => {
          setStats(data)
        })
        .catch((err) => {
          console.error('Error fetching user stats:', err)
          setError('Failed to load user data')
        })
        .finally(() => {
          setIsLoadingStats(false)
        })
    }
  }, [isOpen, userId])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Failed to delete user:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (isDeleting) return
    setStats(null)
    setError(null)
    onClose()
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Delete User
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <span className="font-medium text-gray-900">{userEmail}</span>?
                        This action cannot be undone.
                      </p>

                      {isLoadingStats ? (
                        <div className="mt-3 flex items-center text-sm text-gray-500">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent mr-2" />
                          Loading user data...
                        </div>
                      ) : error ? (
                        <div className="mt-3 text-sm text-red-600">
                          {error}
                        </div>
                      ) : stats ? (
                        <div className="mt-3 p-3 bg-red-50 rounded-md">
                          <p className="text-sm font-medium text-red-800">
                            The following data will be permanently deleted:
                          </p>
                          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                            <li>{stats.booksCount} books tracked</li>
                            <li>{stats.sharedReviewsCount} shared reviews</li>
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={isDeleting || isLoadingStats}
                    onClick={handleDelete}
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleClose}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
