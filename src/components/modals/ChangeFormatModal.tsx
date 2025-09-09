'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition, RadioGroup } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { BookFormat } from '@prisma/client'

interface ChangeFormatModalProps {
  isOpen: boolean
  onClose: () => void
  currentFormat: BookFormat
  bookTitle: string
  onFormatChange: (format: BookFormat) => void
}

const formatOptions = [
  { value: BookFormat.HARDCOVER, label: 'Hardcover', icon: '📖', description: 'Physical hardcover book' },
  { value: BookFormat.PAPERBACK, label: 'Paperback', icon: '📗', description: 'Physical paperback book' },
  { value: BookFormat.EBOOK, label: 'E-Book', icon: '📱', description: 'Digital book for e-readers' },
  { value: BookFormat.AUDIOBOOK, label: 'Audiobook', icon: '🎧', description: 'Audio narration' },
]

export default function ChangeFormatModal({
  isOpen,
  onClose,
  currentFormat,
  bookTitle,
  onFormatChange,
}: ChangeFormatModalProps) {
  const [selected, setSelected] = useState(currentFormat)

  const handleSave = () => {
    if (selected !== currentFormat) {
      onFormatChange(selected)
    }
    onClose()
  }

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
                  Select the format you're reading "{bookTitle}" in:
                </p>

                <RadioGroup value={selected} onChange={setSelected}>
                  <RadioGroup.Label className="sr-only">Reading format</RadioGroup.Label>
                  <div className="space-y-2">
                    {formatOptions.map((option) => (
                      <RadioGroup.Option
                        key={option.value}
                        value={option.value}
                        className={({ active, checked }) =>
                          `${
                            active
                              ? 'ring-2 ring-offset-2 ring-orange-500 dark:ring-offset-gray-800'
                              : ''
                          }
                          ${
                            checked
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          }
                          relative flex cursor-pointer rounded-lg px-5 py-4 border focus:outline-none`
                        }
                      >
                        {({ checked }) => (
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center">
                              <div className="text-2xl mr-3">{option.icon}</div>
                              <div className="text-sm">
                                <RadioGroup.Label
                                  as="p"
                                  className={`font-medium ${
                                    checked ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-gray-100'
                                  }`}
                                >
                                  {option.label}
                                </RadioGroup.Label>
                                <RadioGroup.Description
                                  as="span"
                                  className={`inline ${
                                    checked ? 'text-orange-700 dark:text-orange-300' : 'text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {option.description}
                                </RadioGroup.Description>
                              </div>
                            </div>
                            {checked && (
                              <div className="shrink-0 text-orange-600 dark:text-orange-400">
                                <CheckCircleIcon className="h-6 w-6" />
                              </div>
                            )}
                          </div>
                        )}
                      </RadioGroup.Option>
                    ))}
                  </div>
                </RadioGroup>

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
                    onClick={handleSave}
                    disabled={selected === currentFormat}
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