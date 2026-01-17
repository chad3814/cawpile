'use client'

import ProfileBookCard from './ProfileBookCard'
import ProfileEmptyState from './ProfileEmptyState'
import { ProfileBookData } from '@/types/profile'

interface ProfileBookGridProps {
  books: ProfileBookData[]
}

/**
 * Read-only book grid for public profile display
 * Displays all books in a single grid without section headers
 */
export default function ProfileBookGrid({ books }: ProfileBookGridProps) {
  if (books.length === 0) {
    return <ProfileEmptyState variant="currently-reading" />
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {books.map((book) => (
        <ProfileBookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
