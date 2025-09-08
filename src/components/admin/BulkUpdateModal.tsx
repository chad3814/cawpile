'use client'

import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface BulkUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onConfirm: (bookType: 'FICTION' | 'NONFICTION') => Promise<void>
}

export default function BulkUpdateModal({
  isOpen,
  onClose,
  selectedCount,
  onConfirm
}: BulkUpdateModalProps) {
  const [bookType, setBookType] = useState<'FICTION' | 'NONFICTION'>('FICTION')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleConfirm = async () => {
    setIsUpdating(true)
    try {
      await onConfirm(bookType)
      onClose()
    } catch (error) {
      console.error('Failed to update books:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
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
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      Bulk Update Book Type
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You are about to change the type for {selectedCount} book{selectedCount !== 1 ? 's' : ''}. 
                        This action will be logged and can be reviewed in the audit log.
                      </p>
                      
                      <div className="mt-4">
                        <label htmlFor="bulk-book-type" className="block text-sm font-medium text-gray-700">
                          New Book Type
                        </label>
                        <select
                          id="bulk-book-type"
                          value={bookType}
                          onChange={(e) => setBookType(e.target.value as 'FICTION' | 'NONFICTION')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                          disabled={isUpdating}
                        >
                          <option value="FICTION">Fiction</option>
                          <option value="NONFICTION">Non-Fiction</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleConfirm}
                    className="inline-flex w-full justify-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdating ? 'Updating...' : 'Update Books'}
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={onClose}
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