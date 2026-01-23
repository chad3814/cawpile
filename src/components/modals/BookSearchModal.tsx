"use client"

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useBookSearch } from '@/hooks/useBookSearch'
import type { SignedBookSearchResult } from '@/lib/search/types'
import Image from 'next/image'

interface BookSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectBook: (book: SignedBookSearchResult) => void
}

/**
 * Get display name for tagged search providers
 */
function getProviderDisplayName(provider: string | null): string {
  switch (provider) {
    case 'ibdb':
      return 'IBDb'
    case 'hardcover':
      return 'Hardcover'
    case 'gbid':
    case 'google':
      return 'Google Books'
    case 'isbn':
      return 'ISBN'
    default:
      return provider || 'provider'
  }
}

/**
 * Get loading text for search type
 */
function getLoadingText(searchType: 'standard' | 'tagged', taggedProvider: string | null): string {
  if (searchType === 'tagged' && taggedProvider) {
    const providerName = getProviderDisplayName(taggedProvider)
    if (taggedProvider === 'isbn') {
      return 'Searching by ISBN...'
    }
    return `Searching ${providerName} by ID...`
  }
  return 'Searching...'
}

export default function BookSearchModal({ isOpen, onClose, onSelectBook }: BookSearchModalProps) {
  const { query, setQuery, results, isLoading, error, searchType, taggedProvider } = useBookSearch()

  const handleSelectBook = (book: SignedBookSearchResult) => {
    onSelectBook(book)
    onClose()
    setQuery('')
  }

  const handleClose = () => {
    onClose()
    setQuery('')
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
          <div className="flex min-h-full items-start justify-center p-4 pt-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card p-6 text-left align-middle shadow-xl transition-all border border-border">
                <Dialog.Title as="div" className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold leading-6 text-card-foreground">
                    Search for a book
                  </h3>
                  <button
                    onClick={handleClose}
                    title="Close"
                    className="rounded-md p-1 hover:bg-muted transition-colors focus-ring"
                  >
                    <XMarkIcon className="h-5 w-5 text-muted-foreground" />
                  </button>
                </Dialog.Title>

                {/* Search Input */}
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="block w-full rounded-md border border-border bg-input py-2 pl-10 pr-3 text-sm text-card-foreground placeholder-muted-foreground focus-ring"
                    placeholder="Search by title, author, or ISBN..."
                    autoFocus
                  />
                </div>

                {/* Search Results */}
                <div className="mt-4 max-h-96 overflow-y-auto">
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        {getLoadingText(searchType, taggedProvider)}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-md bg-destructive/10 p-4 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">{error}</p>
                    </div>
                  )}

                  {!isLoading && !error && query && results.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No books found for &ldquo;{query}&rdquo;</p>
                    </div>
                  )}

                  {!isLoading && results.length > 0 && (
                    <div className="space-y-2">
                      {results.map((book, index) => (
                        <button
                          key={`${book.id}-${index}`}
                          onClick={() => handleSelectBook(book)}
                          className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted transition-colors focus-ring"
                        >
                          <div className="flex space-x-3">
                            {/* Book Cover */}
                            <div className="flex-shrink-0">
                              {book.imageUrl ? (
                                <Image
                                  src={book.imageUrl}
                                  alt={book.title}
                                  width={48}
                                  height={72}
                                  className="rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-18 bg-muted rounded flex items-center justify-center">
                                  <svg
                                    className="w-6 h-8 text-muted-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Book Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-card-foreground truncate">
                                {book.title}
                              </p>
                              {book.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {book.subtitle}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {book.authors.join(', ')} {book.publishedDate && `• ${book.publishedDate.split('-')[0]}`}
                              </p>
                              {book.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {book.description.substring(0, 150)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
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
