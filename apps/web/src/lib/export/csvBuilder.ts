/**
 * CSV builder functions for generating individual CSV files.
 */

import type {
  ProfileCsvRow,
  BookCsvRow,
  RatingCsvRow,
  SessionCsvRow,
  SharedReviewCsvRow,
  BookClubCsvRow,
  ReadathonCsvRow,
  CsvExportData,
} from '@/types/export'
import { convertToCsv, type RawUserExportData } from './exportUtils'

const PROFILE_HEADERS: (keyof ProfileCsvRow)[] = [
  'name',
  'username',
  'bio',
  'readingGoal',
  'dashboardLayout',
  'librarySortBy',
  'librarySortOrder',
  'profileEnabled',
  'showCurrentlyReading',
  'showTbr',
]

const BOOK_HEADERS: (keyof BookCsvRow)[] = [
  'userBookId',
  'status',
  'format',
  'startDate',
  'finishDate',
  'progress',
  'currentPage',
  'review',
  'notes',
  'isFavorite',
  'acquisitionMethod',
  'acquisitionOther',
  'bookClubName',
  'readathonName',
  'isReread',
  'dnfReason',
  'lgbtqRepresentation',
  'lgbtqDetails',
  'disabilityRepresentation',
  'disabilityDetails',
  'isNewAuthor',
  'authorPoc',
  'authorPocDetails',
  'preferredCoverProvider',
  'createdAt',
  'updatedAt',
  'bookTitle',
  'bookAuthors',
  'isbn10',
  'isbn13',
  'editionId',
]

const RATING_HEADERS: (keyof RatingCsvRow)[] = [
  'userBookId',
  'characters',
  'atmosphere',
  'writing',
  'plot',
  'intrigue',
  'logic',
  'enjoyment',
  'average',
]

const SESSION_HEADERS: (keyof SessionCsvRow)[] = [
  'sessionId',
  'userBookId',
  'startPage',
  'endPage',
  'pagesRead',
  'duration',
  'notes',
  'sessionDate',
]

const SHARED_REVIEW_HEADERS: (keyof SharedReviewCsvRow)[] = [
  'userBookId',
  'shareToken',
  'showDates',
  'showBookClubs',
  'showReadathons',
  'showReview',
]

const BOOK_CLUB_HEADERS: (keyof BookClubCsvRow)[] = ['name', 'usageCount', 'lastUsed']

const READATHON_HEADERS: (keyof ReadathonCsvRow)[] = ['name', 'usageCount', 'lastUsed']

/**
 * Builds profile.csv content.
 */
export function buildProfileCsv(profile: RawUserExportData['profile']): string {
  const row: ProfileCsvRow = {
    name: profile.name ?? '',
    username: profile.username ?? '',
    bio: profile.bio ?? '',
    readingGoal: String(profile.readingGoal),
    dashboardLayout: profile.dashboardLayout,
    librarySortBy: profile.librarySortBy,
    librarySortOrder: profile.librarySortOrder,
    profileEnabled: String(profile.profileEnabled),
    showCurrentlyReading: String(profile.showCurrentlyReading),
    showTbr: String(profile.showTbr),
  }

  return convertToCsv([row], PROFILE_HEADERS)
}

/**
 * Builds books.csv content with denormalized book data.
 */
export function buildBooksCsv(userBooks: RawUserExportData['userBooks']): string {
  const rows: BookCsvRow[] = userBooks.map((ub) => ({
    userBookId: ub.id,
    status: ub.status,
    format: ub.format.join(';'),
    startDate: ub.startDate?.toISOString() ?? '',
    finishDate: ub.finishDate?.toISOString() ?? '',
    progress: String(ub.progress),
    currentPage: String(ub.currentPage),
    review: ub.review ?? '',
    notes: ub.notes ?? '',
    isFavorite: String(ub.isFavorite),
    acquisitionMethod: ub.acquisitionMethod ?? '',
    acquisitionOther: ub.acquisitionOther ?? '',
    bookClubName: ub.bookClubName ?? '',
    readathonName: ub.readathonName ?? '',
    isReread: ub.isReread === null ? '' : String(ub.isReread),
    dnfReason: ub.dnfReason ?? '',
    lgbtqRepresentation: ub.lgbtqRepresentation ?? '',
    lgbtqDetails: ub.lgbtqDetails ?? '',
    disabilityRepresentation: ub.disabilityRepresentation ?? '',
    disabilityDetails: ub.disabilityDetails ?? '',
    isNewAuthor: ub.isNewAuthor === null ? '' : String(ub.isNewAuthor),
    authorPoc: ub.authorPoc ?? '',
    authorPocDetails: ub.authorPocDetails ?? '',
    preferredCoverProvider: ub.preferredCoverProvider ?? '',
    createdAt: ub.createdAt.toISOString(),
    updatedAt: ub.updatedAt.toISOString(),
    bookTitle: ub.edition.book.title,
    bookAuthors: ub.edition.book.authors.join(';'),
    isbn10: ub.edition.isbn10 ?? '',
    isbn13: ub.edition.isbn13 ?? '',
    editionId: ub.edition.id,
  }))

  return convertToCsv(rows, BOOK_HEADERS)
}

/**
 * Builds ratings.csv content extracting cawpileRating data.
 */
export function buildRatingsCsv(userBooks: RawUserExportData['userBooks']): string {
  const rows: RatingCsvRow[] = userBooks
    .filter((ub) => ub.cawpileRating !== null)
    .map((ub) => {
      const rating = ub.cawpileRating!
      return {
        userBookId: ub.id,
        characters: rating.characters === null ? '' : String(rating.characters),
        atmosphere: rating.atmosphere === null ? '' : String(rating.atmosphere),
        writing: rating.writing === null ? '' : String(rating.writing),
        plot: rating.plot === null ? '' : String(rating.plot),
        intrigue: rating.intrigue === null ? '' : String(rating.intrigue),
        logic: rating.logic === null ? '' : String(rating.logic),
        enjoyment: rating.enjoyment === null ? '' : String(rating.enjoyment),
        average: String(rating.average),
      }
    })

  return convertToCsv(rows, RATING_HEADERS)
}

/**
 * Builds reading-sessions.csv content.
 */
export function buildSessionsCsv(userBooks: RawUserExportData['userBooks']): string {
  const rows: SessionCsvRow[] = userBooks.flatMap((ub) =>
    ub.readingSessions.map((session) => ({
      sessionId: session.id,
      userBookId: ub.id,
      startPage: String(session.startPage),
      endPage: String(session.endPage),
      pagesRead: String(session.pagesRead),
      duration: session.duration === null ? '' : String(session.duration),
      notes: session.notes ?? '',
      sessionDate: session.sessionDate.toISOString(),
    }))
  )

  return convertToCsv(rows, SESSION_HEADERS)
}

/**
 * Builds shared-reviews.csv content.
 */
export function buildSharedReviewsCsv(userBooks: RawUserExportData['userBooks']): string {
  const rows: SharedReviewCsvRow[] = userBooks
    .filter((ub) => ub.sharedReview !== null)
    .map((ub) => {
      const sr = ub.sharedReview!
      return {
        userBookId: ub.id,
        shareToken: sr.shareToken,
        showDates: String(sr.showDates),
        showBookClubs: String(sr.showBookClubs),
        showReadathons: String(sr.showReadathons),
        showReview: String(sr.showReview),
      }
    })

  return convertToCsv(rows, SHARED_REVIEW_HEADERS)
}

/**
 * Builds book-clubs.csv content.
 */
export function buildBookClubsCsv(bookClubs: RawUserExportData['bookClubs']): string {
  const rows: BookClubCsvRow[] = bookClubs.map((bc) => ({
    name: bc.name,
    usageCount: String(bc.usageCount),
    lastUsed: bc.lastUsed.toISOString(),
  }))

  return convertToCsv(rows, BOOK_CLUB_HEADERS)
}

/**
 * Builds readathons.csv content.
 */
export function buildReadathonsCsv(readathons: RawUserExportData['readathons']): string {
  const rows: ReadathonCsvRow[] = readathons.map((r) => ({
    name: r.name,
    usageCount: String(r.usageCount),
    lastUsed: r.lastUsed.toISOString(),
  }))

  return convertToCsv(rows, READATHON_HEADERS)
}

/**
 * Builds all CSV data for export.
 */
export function buildAllCsvData(data: RawUserExportData): CsvExportData {
  return {
    profile: [
      {
        name: data.profile.name ?? '',
        username: data.profile.username ?? '',
        bio: data.profile.bio ?? '',
        readingGoal: String(data.profile.readingGoal),
        dashboardLayout: data.profile.dashboardLayout,
        librarySortBy: data.profile.librarySortBy,
        librarySortOrder: data.profile.librarySortOrder,
        profileEnabled: String(data.profile.profileEnabled),
        showCurrentlyReading: String(data.profile.showCurrentlyReading),
        showTbr: String(data.profile.showTbr),
      },
    ],
    books: data.userBooks.map((ub) => ({
      userBookId: ub.id,
      status: ub.status,
      format: ub.format.join(';'),
      startDate: ub.startDate?.toISOString() ?? '',
      finishDate: ub.finishDate?.toISOString() ?? '',
      progress: String(ub.progress),
      currentPage: String(ub.currentPage),
      review: ub.review ?? '',
      notes: ub.notes ?? '',
      isFavorite: String(ub.isFavorite),
      acquisitionMethod: ub.acquisitionMethod ?? '',
      acquisitionOther: ub.acquisitionOther ?? '',
      bookClubName: ub.bookClubName ?? '',
      readathonName: ub.readathonName ?? '',
      isReread: ub.isReread === null ? '' : String(ub.isReread),
      dnfReason: ub.dnfReason ?? '',
      lgbtqRepresentation: ub.lgbtqRepresentation ?? '',
      lgbtqDetails: ub.lgbtqDetails ?? '',
      disabilityRepresentation: ub.disabilityRepresentation ?? '',
      disabilityDetails: ub.disabilityDetails ?? '',
      isNewAuthor: ub.isNewAuthor === null ? '' : String(ub.isNewAuthor),
      authorPoc: ub.authorPoc ?? '',
      authorPocDetails: ub.authorPocDetails ?? '',
      preferredCoverProvider: ub.preferredCoverProvider ?? '',
      createdAt: ub.createdAt.toISOString(),
      updatedAt: ub.updatedAt.toISOString(),
      bookTitle: ub.edition.book.title,
      bookAuthors: ub.edition.book.authors.join(';'),
      isbn10: ub.edition.isbn10 ?? '',
      isbn13: ub.edition.isbn13 ?? '',
      editionId: ub.edition.id,
    })),
    ratings: data.userBooks
      .filter((ub) => ub.cawpileRating !== null)
      .map((ub) => {
        const rating = ub.cawpileRating!
        return {
          userBookId: ub.id,
          characters: rating.characters === null ? '' : String(rating.characters),
          atmosphere: rating.atmosphere === null ? '' : String(rating.atmosphere),
          writing: rating.writing === null ? '' : String(rating.writing),
          plot: rating.plot === null ? '' : String(rating.plot),
          intrigue: rating.intrigue === null ? '' : String(rating.intrigue),
          logic: rating.logic === null ? '' : String(rating.logic),
          enjoyment: rating.enjoyment === null ? '' : String(rating.enjoyment),
          average: String(rating.average),
        }
      }),
    sessions: data.userBooks.flatMap((ub) =>
      ub.readingSessions.map((session) => ({
        sessionId: session.id,
        userBookId: ub.id,
        startPage: String(session.startPage),
        endPage: String(session.endPage),
        pagesRead: String(session.pagesRead),
        duration: session.duration === null ? '' : String(session.duration),
        notes: session.notes ?? '',
        sessionDate: session.sessionDate.toISOString(),
      }))
    ),
    sharedReviews: data.userBooks
      .filter((ub) => ub.sharedReview !== null)
      .map((ub) => {
        const sr = ub.sharedReview!
        return {
          userBookId: ub.id,
          shareToken: sr.shareToken,
          showDates: String(sr.showDates),
          showBookClubs: String(sr.showBookClubs),
          showReadathons: String(sr.showReadathons),
          showReview: String(sr.showReview),
        }
      }),
    bookClubs: data.bookClubs.map((bc) => ({
      name: bc.name,
      usageCount: String(bc.usageCount),
      lastUsed: bc.lastUsed.toISOString(),
    })),
    readathons: data.readathons.map((r) => ({
      name: r.name,
      usageCount: String(r.usageCount),
      lastUsed: r.lastUsed.toISOString(),
    })),
  }
}
