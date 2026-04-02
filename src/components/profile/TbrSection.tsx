'use client'

import TbrBookCard from './TbrBookCard'
import HeroScrollRow from '@/components/HeroScrollRow'
import { ProfileTbrData } from '@/types/profile'

interface TbrSectionProps {
  tbr: ProfileTbrData
  title?: string
}

/**
 * TBR (Want to Read) section for public profile display
 * Shows books in a horizontal scroll carousel with minimal information (cover, title, author only)
 */
export default function TbrSection({ tbr, title }: TbrSectionProps) {
  return (
    <HeroScrollRow title={title}>
      {tbr.books.map((book) => (
        <div key={book.id} className="shrink-0 w-40">
          <TbrBookCard book={book} />
        </div>
      ))}
    </HeroScrollRow>
  )
}
