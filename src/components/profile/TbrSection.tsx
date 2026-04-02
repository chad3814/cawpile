'use client'

import TbrBookCard from './TbrBookCard'
import ProfileEmptyState from './ProfileEmptyState'
import HeroScrollRow from '@/components/HeroScrollRow'
import { ProfileTbrData } from '@/types/profile'

interface TbrSectionProps {
  tbr: ProfileTbrData
}

/**
 * TBR (Want to Read) section for public profile display
 * Shows books in a horizontal scroll carousel with minimal information (cover, title, author only)
 */
export default function TbrSection({ tbr }: TbrSectionProps) {
  if (tbr.books.length === 0) {
    return <ProfileEmptyState variant="tbr" />
  }

  return (
    <HeroScrollRow>
      {tbr.books.map((book) => (
        <div key={book.id} className="shrink-0 w-40">
          <TbrBookCard book={book} />
        </div>
      ))}
    </HeroScrollRow>
  )
}
