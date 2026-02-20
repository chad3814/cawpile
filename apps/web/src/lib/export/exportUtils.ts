/**
 * Utility functions for user data export.
 */

import type {
  JsonExportData,
  ProfileExport,
  UserBookExport,
  BookClubExport,
  ReadathonExport,
  ExportFormat,
} from '@/types/export'

// Type for raw user data from Prisma query
export interface RawUserExportData {
  profile: {
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
  userBooks: Array<{
    id: string
    status: string
    format: string[]
    startDate: Date | null
    finishDate: Date | null
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
    createdAt: Date
    updatedAt: Date
    edition: {
      id: string
      isbn10: string | null
      isbn13: string | null
      book: {
        title: string
        authors: string[]
      }
    }
    cawpileRating: {
      characters: number | null
      atmosphere: number | null
      writing: number | null
      plot: number | null
      intrigue: number | null
      logic: number | null
      enjoyment: number | null
      average: number
    } | null
    readingSessions: Array<{
      id: string
      startPage: number
      endPage: number
      pagesRead: number
      duration: number | null
      notes: string | null
      sessionDate: Date
    }>
    sharedReview: {
      shareToken: string
      showDates: boolean
      showBookClubs: boolean
      showReadathons: boolean
      showReview: boolean
    } | null
  }>
  bookClubs: Array<{
    name: string
    usageCount: number
    lastUsed: Date
  }>
  readathons: Array<{
    name: string
    usageCount: number
    lastUsed: Date
  }>
}

/**
 * Formats a date as YYYY-MM-DD string.
 */
export function formatExportDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Generates export filename with current date.
 */
export function generateExportFilename(format: ExportFormat): string {
  const date = formatExportDate(new Date())
  const extension = format === 'json' ? 'json' : 'zip'
  return `cawpile-export-${date}.${extension}`
}

/**
 * Converts a Date to ISO string or null.
 */
function dateToIsoString(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

/**
 * Builds the JSON export structure from raw user data.
 */
export function buildJsonExport(data: RawUserExportData): JsonExportData {
  const profile: ProfileExport = {
    name: data.profile.name,
    username: data.profile.username,
    bio: data.profile.bio,
    readingGoal: data.profile.readingGoal,
    dashboardLayout: data.profile.dashboardLayout,
    librarySortBy: data.profile.librarySortBy,
    librarySortOrder: data.profile.librarySortOrder,
    profileEnabled: data.profile.profileEnabled,
    showCurrentlyReading: data.profile.showCurrentlyReading,
    showTbr: data.profile.showTbr,
  }

  const userBooks: UserBookExport[] = data.userBooks.map((ub) => ({
    id: ub.id,
    status: ub.status,
    format: ub.format,
    startDate: dateToIsoString(ub.startDate),
    finishDate: dateToIsoString(ub.finishDate),
    progress: ub.progress,
    currentPage: ub.currentPage,
    review: ub.review,
    notes: ub.notes,
    isFavorite: ub.isFavorite,
    acquisitionMethod: ub.acquisitionMethod,
    acquisitionOther: ub.acquisitionOther,
    bookClubName: ub.bookClubName,
    readathonName: ub.readathonName,
    isReread: ub.isReread,
    dnfReason: ub.dnfReason,
    lgbtqRepresentation: ub.lgbtqRepresentation,
    lgbtqDetails: ub.lgbtqDetails,
    disabilityRepresentation: ub.disabilityRepresentation,
    disabilityDetails: ub.disabilityDetails,
    isNewAuthor: ub.isNewAuthor,
    authorPoc: ub.authorPoc,
    authorPocDetails: ub.authorPocDetails,
    preferredCoverProvider: ub.preferredCoverProvider,
    createdAt: ub.createdAt.toISOString(),
    updatedAt: ub.updatedAt.toISOString(),
    bookTitle: ub.edition.book.title,
    bookAuthors: ub.edition.book.authors,
    isbn10: ub.edition.isbn10,
    isbn13: ub.edition.isbn13,
    editionId: ub.edition.id,
    cawpileRating: ub.cawpileRating
      ? {
          characters: ub.cawpileRating.characters,
          atmosphere: ub.cawpileRating.atmosphere,
          writing: ub.cawpileRating.writing,
          plot: ub.cawpileRating.plot,
          intrigue: ub.cawpileRating.intrigue,
          logic: ub.cawpileRating.logic,
          enjoyment: ub.cawpileRating.enjoyment,
          average: ub.cawpileRating.average,
        }
      : null,
    readingSessions: ub.readingSessions.map((session) => ({
      id: session.id,
      startPage: session.startPage,
      endPage: session.endPage,
      pagesRead: session.pagesRead,
      duration: session.duration,
      notes: session.notes,
      sessionDate: session.sessionDate.toISOString(),
    })),
    sharedReview: ub.sharedReview
      ? {
          shareToken: ub.sharedReview.shareToken,
          showDates: ub.sharedReview.showDates,
          showBookClubs: ub.sharedReview.showBookClubs,
          showReadathons: ub.sharedReview.showReadathons,
          showReview: ub.sharedReview.showReview,
        }
      : null,
  }))

  const bookClubs: BookClubExport[] = data.bookClubs.map((bc) => ({
    name: bc.name,
    usageCount: bc.usageCount,
    lastUsed: bc.lastUsed.toISOString(),
  }))

  const readathons: ReadathonExport[] = data.readathons.map((r) => ({
    name: r.name,
    usageCount: r.usageCount,
    lastUsed: r.lastUsed.toISOString(),
  }))

  return {
    exportedAt: new Date().toISOString(),
    exportVersion: '1.0',
    profile,
    userBooks,
    bookClubs,
    readathons,
  }
}

/**
 * Escapes a value for CSV format.
 * - Wraps in quotes if contains comma, newline, or quote
 * - Doubles any quote characters within
 */
export function escapeCsvValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)

  // Check if value needs to be quoted
  const needsQuoting = str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')

  if (needsQuoting) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Converts an array of row objects to CSV string.
 */
export function convertToCsv<T extends { [K in keyof T]: string }>(
  rows: T[],
  headers: (keyof T)[]
): string {
  // Create header row
  const headerRow = headers.map((h) => escapeCsvValue(String(h))).join(',')

  // Create data rows
  const dataRows = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(',')
  )

  return [headerRow, ...dataRows].join('\n')
}
