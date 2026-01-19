"use client"

import { useState } from 'react'
import BookSearchModal from '@/components/modals/BookSearchModal'
import AddBookWizard from '@/components/modals/AddBookWizard'
import type { SignedBookSearchResult } from '@/lib/search/types'
import { useRouter } from 'next/navigation'

export default function EmptyLibrary() {
  const router = useRouter()
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isAddWizardOpen, setIsAddWizardOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<SignedBookSearchResult | null>(null)

  const handleSelectBook = (book: SignedBookSearchResult) => {
    setSelectedBook(book)
    setIsSearchModalOpen(false)
    setIsAddWizardOpen(true)
  }

  const handleBookAdded = () => {
    setSelectedBook(null)
    setIsAddWizardOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg">
        <svg
          className="w-24 h-24 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>

        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Start building your library
        </h2>

        <p className="text-gray-600 mb-6 text-center max-w-md">
          Add your first book to get started. Track what you&apos;re reading, want to read, or have finished.
        </p>

        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Add Your First Book
        </button>
      </div>

      {/* Modals */}
      <BookSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectBook={handleSelectBook}
      />

      <AddBookWizard
        isOpen={isAddWizardOpen}
        onClose={() => setIsAddWizardOpen(false)}
        book={selectedBook}
        onComplete={handleBookAdded}
      />
    </>
  )
}