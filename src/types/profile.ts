import { BookStatus, BookFormat } from '@prisma/client'

/**
 * User data displayed on a public profile page
 */
export interface ProfileUserData {
  id: string
  name: string | null
  username: string
  bio: string | null
  profilePictureUrl: string | null
  image: string | null // OAuth fallback image
  showCurrentlyReading: boolean
}

/**
 * Book data for profile display (read-only variant of dashboard BookData)
 * Reuses the same structure as ViewSwitcher's BookData interface
 */
export interface ProfileBookData {
  id: string
  status: BookStatus
  format: BookFormat[]
  progress: number
  startDate: Date | null
  finishDate: Date | null
  createdAt: Date
  currentPage: number
  edition: {
    id: string
    title: string | null
    book: {
      title: string
      authors: string[]
      bookType?: 'FICTION' | 'NONFICTION'
    }
    googleBook: {
      imageUrl: string | null
      description: string | null
      pageCount: number | null
    } | null
  }
  cawpileRating?: {
    id: string
    average: number
    characters: number | null
    atmosphere: number | null
    writing: number | null
    plot: number | null
    intrigue: number | null
    logic: number | null
    enjoyment: number | null
  } | null
}

/**
 * Shared review preview data for profile display
 */
export interface ProfileSharedReview {
  id: string
  shareToken: string
  showDates: boolean
  showBookClubs: boolean
  showReadathons: boolean
  showReview: boolean
  createdAt: Date
  userBook: {
    id: string
    startDate: Date | null
    finishDate: Date | null
    bookClubName: string | null
    readathonName: string | null
    review: string | null
    edition: {
      id: string
      title: string | null
      book: {
        title: string
        authors: string[]
        bookType?: 'FICTION' | 'NONFICTION'
      }
      googleBook: {
        imageUrl: string | null
      } | null
    }
    cawpileRating: {
      id: string
      average: number
    } | null
  }
}

/**
 * Complete profile page data structure
 */
export interface ProfilePageData {
  user: ProfileUserData
  currentlyReading: ProfileBookData[]
  sharedReviews: ProfileSharedReview[]
}
