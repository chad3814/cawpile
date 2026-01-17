import prisma from '@/lib/prisma'
import { ProfileBookData } from '@/types/profile'

/**
 * Fetch currently reading books for a user's public profile
 * Returns books with status READING, including all necessary relations
 */
export async function getProfileCurrentlyReading(userId: string): Promise<ProfileBookData[]> {
  const userBooks = await prisma.userBook.findMany({
    where: {
      userId: userId,
      status: 'READING'
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
      updatedAt: 'desc'
    }
  })

  return userBooks.map((book) => ({
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
}
