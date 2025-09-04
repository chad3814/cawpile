import prisma from '@/lib/prisma'
import { BookSearchResult } from '@/types/book'
import { Prisma } from '@prisma/client'

export async function findOrCreateBook(
  title: string,
  authors: string[],
  language: string = 'en'
) {
  // First try to find existing book
  const existingBook = await prisma.book.findFirst({
    where: {
      title,
      authors: {
        equals: authors
      }
    }
  })

  if (existingBook) {
    return existingBook
  }

  // Create new book
  return await prisma.book.create({
    data: {
      title,
      authors,
      language
    }
  })
}

export async function findOrCreateEdition(
  bookId: string,
  googleData: BookSearchResult
) {
  // Check if edition exists by ISBN or Google Books ID
  const whereConditions: Prisma.EditionWhereInput[] = []
  
  if (googleData.googleId) {
    whereConditions.push({ googleBooksId: googleData.googleId })
  }
  
  if (googleData.isbn10) {
    whereConditions.push({ isbn10: googleData.isbn10 })
  }
  
  if (googleData.isbn13) {
    whereConditions.push({ isbn13: googleData.isbn13 })
  }

  if (whereConditions.length > 0) {
    const existingEdition = await prisma.edition.findFirst({
      where: {
        OR: whereConditions
      }
    })

    if (existingEdition) {
      return existingEdition
    }
  }

  // Create new edition with Google Books data
  const edition = await prisma.edition.create({
    data: {
      bookId,
      isbn10: googleData.isbn10,
      isbn13: googleData.isbn13,
      title: googleData.subtitle ? `${googleData.title}: ${googleData.subtitle}` : null,
      authors: googleData.authors,
      googleBooksId: googleData.googleId,
      googleBook: {
        create: {
          googleId: googleData.googleId,
          title: googleData.title,
          subtitle: googleData.subtitle,
          authors: googleData.authors,
          description: googleData.description,
          publishedDate: googleData.publishedDate,
          pageCount: googleData.pageCount,
          imageUrl: googleData.imageUrl,
          categories: googleData.categories
        }
      }
    }
  })

  return edition
}