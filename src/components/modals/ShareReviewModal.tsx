'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { copyToClipboard } from '@/lib/utils/clipboard'

interface SharedReview {
  id: string
  shareToken: string
  showDates: boolean
  showBookClubs: boolean
  showReadathons: boolean
}

interface ShareReviewModalProps {
  isOpen: boolean
  onClose: () => void
  userBook: {
    id: string
    bookClubName?: string | null
    readathonName?: string | null
    edition: {
      title: string | null
      book: {
        title: string
        authors: string[]
      }
      googleBook: {
        imageUrl: string | null
      } | null
    }
  }
  existingShare: SharedReview | null
  setShareData: (data: SharedReview | null) => void
}

export default function ShareReviewModal({
  isOpen,
  onClose,
  userBook,
  existingShare,
  setShareData,
}: ShareReviewModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDates, setShowDates] = useState(existingShare?.showDates ?? true)
  const [showBookClubs, setShowBookClubs] = useState(existingShare?.showBookClubs ?? true)
  const [showReadathons, setShowReadathons] = useState(existingShare?.showReadathons ?? true)
  const [copied, setCopied] = useState(false)

  const displayTitle = userBook.edition.title || userBook.edition.book.title
  const imageUrl = userBook.edition.googleBook?.imageUrl
  const shareUrl = existingShare
    ? `${window.location.origin}/share/reviews/${existingShare.shareToken}`
    : null

  const handleCopyUrl = async () => {
    if (!shareUrl) return

    const success = await copyToClipboard(shareUrl)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setError('Failed to copy URL to clipboard')
    }
  }

  const handleCreateShare = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/user/books/${userBook.id}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showDates,
          showBookClubs,
          showReadathons
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create share link')
      }

      const data = await response.json()

      // Copy URL to clipboard automatically
      if (data.shareUrl) {
        await copyToClipboard(data.shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        setShareData(data);
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateSettings = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/user/books/${userBook.id}/share`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showDates,
          showBookClubs,
          showReadathons
        }),
      })

    const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update share settings')
      }
      setShareData(data);
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update share settings')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteShare = async () => {
    if (!confirm('Are you sure you want to delete this share link? The link will no longer be accessible.')) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/user/books/${userBook.id}/share`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete share link')
      }
      setShareData(null);
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete share link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasBookClub = !!userBook.bookClubName
  const hasReadathon = !!userBook.readathonName

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
                    {existingShare ? 'Update Share Settings' : 'Share Your Review'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Book Context */}
                <div className="mb-6 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {imageUrl && (
                    <div className="relative w-12 h-16 flex-shrink-0">
                      <Image
                        src={imageUrl}
                        alt={displayTitle}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {displayTitle}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {userBook.edition.book.authors.join(', ')}
                    </p>
                  </div>
                </div>

                {/* Share URL Display (if exists) */}
                {shareUrl && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Share Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      />
                      <button
                        onClick={handleCopyUrl}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <ClipboardDocumentIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {copied && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                        Link copied to clipboard!
                      </p>
                    )}
                  </div>
                )}

                {/* Privacy Toggles */}
                <div className="mb-6 space-y-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Privacy Settings
                  </h4>

                  {/* Show reading dates */}
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={showDates}
                      onChange={(e) => setShowDates(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Show reading dates
                    </span>
                  </label>

                  {/* Show book clubs */}
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={showBookClubs}
                      onChange={(e) => setShowBookClubs(e.target.checked)}
                      disabled={!hasBookClub}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm ${hasBookClub ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                      Show book clubs {!hasBookClub && '(not set)'}
                    </span>
                  </label>

                  {/* Show readathons */}
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={showReadathons}
                      onChange={(e) => setShowReadathons(e.target.checked)}
                      disabled={!hasReadathon}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className={`text-sm ${hasReadathon ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                      Show readathons {!hasReadathon && '(not set)'}
                    </span>
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  {existingShare ? (
                    <>
                      <button
                        type="button"
                        onClick={handleDeleteShare}
                        className="inline-flex justify-center rounded-md border border-red-300 dark:border-red-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        disabled={isSubmitting}
                      >
                        Delete Share
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateSettings}
                        className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Updating...' : 'Update Settings'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateShare}
                        className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Creating...' : 'Create Share Link'}
                      </button>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
