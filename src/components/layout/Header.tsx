"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import UserMenu from "./UserMenu"
import BookSearchModal from "@/components/modals/BookSearchModal"
import AddBookWizard from "@/components/modals/AddBookWizard"
import { BookSearchResult } from "@/types/book"

export default function Header() {
  const { status } = useSession()
  const router = useRouter()
  const isAuthenticated = status === "authenticated"
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [isAddWizardOpen, setIsAddWizardOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null)

  const handleSelectBook = (book: BookSearchResult) => {
    setSelectedBook(book)
    setIsSearchModalOpen(false)
    setIsAddWizardOpen(true)
  }

  const handleBookAdded = () => {
    setSelectedBook(null)
    setIsAddWizardOpen(false)
    // Refresh the dashboard
    router.refresh()
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="flex items-center space-x-2"
            >
              <svg
                className="w-8 h-8 text-blue-600"
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
              <span className="text-xl font-bold text-gray-900">BookShelf</span>
            </Link>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  {/* Track Book Button */}
                  <button 
                    onClick={() => setIsSearchModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Track Book
                  </button>

                  {/* User Menu */}
                  <UserMenu />
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

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
