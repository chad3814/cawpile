'use client'

interface TrackingBadgesProps {
  isReread?: boolean | null
  bookClubName?: string | null
  readathonName?: string | null
  isNewAuthor?: boolean | null
  lgbtqRepresentation?: string | null
  disabilityRepresentation?: string | null
  authorPoc?: string | null
}

export default function TrackingBadges({
  isReread,
  bookClubName,
  readathonName,
  isNewAuthor,
  lgbtqRepresentation,
  disabilityRepresentation,
  authorPoc
}: TrackingBadgesProps) {
  const badges = []

  if (isReread) {
    badges.push(
      <span key="reread" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
        📖 Re-read
      </span>
    )
  }

  if (bookClubName) {
    badges.push(
      <span key="bookclub" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
        📚 Book Club
      </span>
    )
  }

  if (readathonName) {
    badges.push(
      <span key="readathon" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        🏃 Readathon
      </span>
    )
  }

  if (isNewAuthor) {
    badges.push(
      <span key="newauthor" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300">
        ✨ New Author
      </span>
    )
  }

  if (lgbtqRepresentation === 'Yes') {
    badges.push(
      <span key="lgbtq" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rainbow-gradient text-white">
        🏳️‍🌈
      </span>
    )
  }

  if (disabilityRepresentation === 'Yes') {
    badges.push(
      <span key="disability" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300">
        ♿
      </span>
    )
  }

  if (authorPoc === 'Yes') {
    badges.push(
      <span key="poc" className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        🌍 POC
      </span>
    )
  }

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {badges}
    </div>
  )
}