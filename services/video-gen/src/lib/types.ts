/**
 * Types for the Monthly Reading Recap
 * Matches the export format from Cawpile API
 */

import type { VideoTemplate } from './template-types'

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
  finishDate: string
  rating: RecapBookRating | null
  pageCount: number | null
}

export interface RecapCurrentlyReading {
  id: string
  title: string
  authors: string[]
  coverUrl: string | null
  progress: number
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
    month: number
    year: number
    monthName: string
    generatedAt: string
  }
  books: RecapBook[]
  currentlyReading: RecapCurrentlyReading[]
  stats: RecapStats
}

/**
 * Render request body with userId for S3 path organization
 * and optional template for customization
 */
export interface RenderRequest {
  userId: string
  data: MonthlyRecapExport
  /** Optional template for customizing video style and layout */
  template?: Partial<VideoTemplate>
}

/**
 * Successful render response with S3 URL
 */
export interface RenderResponse {
  success: true
  filename: string
  s3Url: string
  duration: number
  renderTime: string
}

/**
 * Error response for render failures
 */
export interface RenderErrorResponse {
  error: string
  message: string
}

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
