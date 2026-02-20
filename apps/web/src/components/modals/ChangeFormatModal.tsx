'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { BookFormat } from '@prisma/client'
import FormatMultiSelect from '@/components/forms/FormatMultiSelect'

interface ChangeFormatModalProps {
  isOpen: boolean
  onClose: () => void
  currentFormat: BookFormat[]
  bookTitle: string
  onFormatChange: (format: BookFormat[]) => void
}

export default function ChangeFormatModal({
  isOpen,
  onClose,
  currentFormat,
  bookTitle,
  onFormatChange,
}: ChangeFormatModalProps) {
  const [selected, setSelected] = useState<BookFormat[]>(currentFormat)

  const handleSave = () => {
    // Check if selection has changed
    const hasChanged =
      selected.length !== currentFormat.length ||
      !selected.every(f => currentFormat.includes(f)) ||
      !currentFormat.every(f => selected.includes(f))

    if (hasChanged) {
      onFormatChange(selected)
    }
    onClose()
  }

  // Check if formats have changed for button disable state
  const isUnchanged =
    selected.length === currentFormat.length &&
    selected.every(f => currentFormat.includes(f)) &&
    currentFormat.every(f => selected.includes(f))

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
                    Change Reading Format
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Select the format(s) you&rsquo;re reading &ldquo;{bookTitle}&rdquo; in:
                </p>

                <FormatMultiSelect
                  selectedFormats={selected}
                  onChange={setSelected}
                />

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
                    className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSave}
                    disabled={isUnchanged}
                  >
                    Save Changes
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
