/**
 * Types for the Monthly Reading Recap feature
 * Used to export book data for video generation via Remotion
 */

export interface RecapBookRating {
  average: number
  characters: number | null
  atmosphere: number | null
  writing: number | null
  plot: number | null
  intrigue: number | null
  logic: number | null
  enjoyment: number | null
}

export interface RecapBook {
  id: string
  title: string
  authors: string[]
  coverUrl: string | null
  status: 'COMPLETED' | 'DNF'
  finishDate: string // ISO date
  rating: RecapBookRating | null
  pageCount: number | null
}

export interface RecapCurrentlyReading {
  id: string
  title: string
  authors: string[]
  coverUrl: string | null
  progress: number // 0-100
}

export interface RecapStats {
  totalBooks: number
  completedCount: number
  dnfCount: number
  totalPages: number
  averageRating: number | null
  topRatedBook: {
    title: string
    coverUrl: string | null
    rating: number
  } | null
  lowestRatedBook: {
    title: string
    coverUrl: string | null
    rating: number
  } | null
}

export interface MonthlyRecapExport {
  meta: {
    month: number // 1-12
    year: number
    monthName: string // "January"
    generatedAt: string // ISO date
  }
  books: RecapBook[]
  currentlyReading: RecapCurrentlyReading[]
  stats: RecapStats
}

export interface MonthlyRecapPreview {
  month: number
  year: number
  monthName: string
  bookCount: number
  completedCount: number
  dnfCount: number
}

// Month names for display
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || ''
}
