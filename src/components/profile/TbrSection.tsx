'use client'

import TbrBookCard from './TbrBookCard'
import ProfileEmptyState from './ProfileEmptyState'
import { ProfileTbrData } from '@/types/profile'

interface TbrSectionProps {
  tbr: ProfileTbrData
}

/**
 * TBR (Want to Read) section for public profile display
 * Shows up to 5 books with minimal information (cover, title, author only)
 */
export default function TbrSection({ tbr }: TbrSectionProps) {
  if (tbr.books.length === 0) {
    return <ProfileEmptyState variant="tbr" />
  }

  return (
    <div>
      {/* Count display when total exceeds displayed books */}
      {tbr.totalCount > 5 && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {tbr.books.length} of {tbr.totalCount} books
        </p>
      )}

      {/* TBR Books Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tbr.books.map((book) => (
          <TbrBookCard key={book.id} book={book} />
        ))}
      </div>
    </div>
  )
}
