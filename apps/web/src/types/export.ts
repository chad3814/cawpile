/**
 * Type definitions for user data export functionality.
 */

// Export format options
export type ExportFormat = 'json' | 'csv'

// Profile fields included in export
export interface ProfileExport {
  name: string | null
  username: string | null
  bio: string | null
  readingGoal: number
  dashboardLayout: string
  librarySortBy: string
  librarySortOrder: string
  profileEnabled: boolean
  showCurrentlyReading: boolean
  showTbr: boolean
}

// Cawpile rating data for export
export interface CawpileRatingExport {
  characters: number | null
  atmosphere: number | null
  writing: number | null
  plot: number | null
  intrigue: number | null
  logic: number | null
  enjoyment: number | null
  average: number
}

// Reading session data for export
export interface ReadingSessionExport {
  id: string
  startPage: number
  endPage: number
  pagesRead: number
  duration: number | null
  notes: string | null
  sessionDate: string
}

// Shared review data for export
export interface SharedReviewExport {
  shareToken: string
  showDates: boolean
  showBookClubs: boolean
  showReadathons: boolean
  showReview: boolean
}

// User book data for export with nested relationships and book metadata
export interface UserBookExport {
  id: string
  status: string
  format: string[]
  startDate: string | null
  finishDate: string | null
  progress: number
  currentPage: number
  review: string | null
  notes: string | null
  isFavorite: boolean
  acquisitionMethod: string | null
  acquisitionOther: string | null
  bookClubName: string | null
  readathonName: string | null
  isReread: boolean | null
  dnfReason: string | null
  lgbtqRepresentation: string | null
  lgbtqDetails: string | null
  disabilityRepresentation: string | null
  disabilityDetails: string | null
  isNewAuthor: boolean | null
  authorPoc: string | null
  authorPocDetails: string | null
  preferredCoverProvider: string | null
  createdAt: string
  updatedAt: string
  // Inline book metadata for self-contained export
  bookTitle: string
  bookAuthors: string[]
  isbn10: string | null
  isbn13: string | null
  editionId: string
  // Nested relationships
  cawpileRating: CawpileRatingExport | null
  readingSessions: ReadingSessionExport[]
  sharedReview: SharedReviewExport | null
}

// Book club data for export
export interface BookClubExport {
  name: string
  usageCount: number
  lastUsed: string
}

// Readathon data for export
export interface ReadathonExport {
  name: string
  usageCount: number
  lastUsed: string
}

// Complete JSON export structure
export interface JsonExportData {
  exportedAt: string
  exportVersion: '1.0'
  profile: ProfileExport
  userBooks: UserBookExport[]
  bookClubs: BookClubExport[]
  readathons: ReadathonExport[]
}

// CSV row types for each file

export interface ProfileCsvRow {
  name: string
  username: string
  bio: string
  readingGoal: string
  dashboardLayout: string
  librarySortBy: string
  librarySortOrder: string
  profileEnabled: string
  showCurrentlyReading: string
  showTbr: string
}

export interface BookCsvRow {
  userBookId: string
  status: string
  format: string
  startDate: string
  finishDate: string
  progress: string
  currentPage: string
  review: string
  notes: string
  isFavorite: string
  acquisitionMethod: string
  acquisitionOther: string
  bookClubName: string
  readathonName: string
  isReread: string
  dnfReason: string
  lgbtqRepresentation: string
  lgbtqDetails: string
  disabilityRepresentation: string
  disabilityDetails: string
  isNewAuthor: string
  authorPoc: string
  authorPocDetails: string
  preferredCoverProvider: string
  createdAt: string
  updatedAt: string
  bookTitle: string
  bookAuthors: string
  isbn10: string
  isbn13: string
  editionId: string
}

export interface RatingCsvRow {
  userBookId: string
  characters: string
  atmosphere: string
  writing: string
  plot: string
  intrigue: string
  logic: string
  enjoyment: string
  average: string
}

export interface SessionCsvRow {
  sessionId: string
  userBookId: string
  startPage: string
  endPage: string
  pagesRead: string
  duration: string
  notes: string
  sessionDate: string
}

export interface SharedReviewCsvRow {
  userBookId: string
  shareToken: string
  showDates: string
  showBookClubs: string
  showReadathons: string
  showReview: string
}

export interface BookClubCsvRow {
  name: string
  usageCount: string
  lastUsed: string
}

export interface ReadathonCsvRow {
  name: string
  usageCount: string
  lastUsed: string
}

// CSV data collection for zip export
export interface CsvExportData {
  profile: ProfileCsvRow[]
  books: BookCsvRow[]
  ratings: RatingCsvRow[]
  sessions: SessionCsvRow[]
  sharedReviews: SharedReviewCsvRow[]
  bookClubs: BookClubCsvRow[]
  readathons: ReadathonCsvRow[]
}
