import prisma from '@/lib/prisma'
import { ProfileBookData } from '@/types/profile'

/**
 * Result type for TBR books query
 */
export interface ProfileTbrResult {
  books: ProfileBookData[]
  totalCount: number
}

/**
 * Fetch TBR (Want to Read) books for a user's public profile
 * Returns up to 5 books ordered by most recently added, plus total count
 */
export async function getProfileTbr(userId: string): Promise<ProfileTbrResult> {
  // Get total count of TBR books
  const totalCount = await prisma.userBook.count({
    where: {
      userId: userId,
      status: 'WANT_TO_READ'
    }
  })

  // Fetch up to 5 TBR books, ordered by most recently added
  const userBooks = await prisma.userBook.findMany({
    where: {
      userId: userId,
      status: 'WANT_TO_READ'
    },
    include: {
      edition: {
        include: {
          book: true,
          googleBook: true
        }
      },
      cawpileRating: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  const books: ProfileBookData[] = userBooks.map((book) => ({
    id: book.id,
    status: book.status,
    format: book.format,
    progress: book.progress,
    startDate: book.startDate,
    finishDate: book.finishDate,
    createdAt: book.createdAt,
    currentPage: book.currentPage,
    edition: {
      id: book.edition.id,
      title: book.edition.title,
      book: {
        title: book.edition.book.title,
        authors: book.edition.book.authors,
        bookType: book.edition.book.bookType
      },
      googleBook: book.edition.googleBook ? {
        imageUrl: book.edition.googleBook.imageUrl,
        description: book.edition.googleBook.description,
        pageCount: book.edition.googleBook.pageCount
      } : null
    },
    cawpileRating: book.cawpileRating ? {
      id: book.cawpileRating.id,
      average: book.cawpileRating.average,
      characters: book.cawpileRating.characters,
      atmosphere: book.cawpileRating.atmosphere,
      writing: book.cawpileRating.writing,
      plot: book.cawpileRating.plot,
      intrigue: book.cawpileRating.intrigue,
      logic: book.cawpileRating.logic,
      enjoyment: book.cawpileRating.enjoyment
    } : null
  }))

  return {
    books,
    totalCount
  }
}
