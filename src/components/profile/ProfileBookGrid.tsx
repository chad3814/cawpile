'use client'

import ProfileBookCard from './ProfileBookCard'
import ProfileEmptyState from './ProfileEmptyState'
import HeroScrollRow from '@/components/HeroScrollRow'
import { ProfileBookData } from '@/types/profile'

interface ProfileBookGridProps {
  books: ProfileBookData[]
}

/**
 * Read-only book carousel for public profile display
 * Displays all books in a horizontal scroll row without section headers
 */
export default function ProfileBookGrid({ books }: ProfileBookGridProps) {
  if (books.length === 0) {
    return <ProfileEmptyState variant="currently-reading" />
  }

  return (
    <HeroScrollRow>
      {books.map((book) => (
        <div key={book.id} className="shrink-0 w-40">
          <ProfileBookCard book={book} />
        </div>
      ))}
    </HeroScrollRow>
  )
}
