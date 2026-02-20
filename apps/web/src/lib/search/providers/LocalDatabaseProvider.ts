import { BaseSearchProvider } from "../BaseSearchProvider"
import type { BookSearchResult } from "@/types/book"
import { prisma } from "@/lib/prisma"

/**
 * Get cover image URL from edition provider relations with fallback logic
 * Priority: Hardcover > Google > IBDB
 */
function getEditionCoverUrl(edition: {
  hardcoverBook?: { imageUrl: string | null } | null
  googleBook?: { imageUrl: string | null } | null
  ibdbBook?: { imageUrl: string | null } | null
}): string | undefined {
  return (
    edition.hardcoverBook?.imageUrl ||
    edition.googleBook?.imageUrl ||
    edition.ibdbBook?.imageUrl ||
    undefined
  ) ?? undefined
}

export class LocalDatabaseProvider extends BaseSearchProvider {
  constructor() {
    super({
      name: "local",
      weight: 10, // Highest priority
      timeout: 5000
    })
  }

  protected async searchInternal(query: string, limit: number): Promise<BookSearchResult[]> {
    try {
      // Search Books table
      const booksPromise = prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { authors: { hasSome: [query] } }
          ]
        },
        take: limit,
        select: {
          id: true,
          title: true,
          authors: true
        }
      })

      // Search Editions table with provider relations for cover images
      const editionsPromise = prisma.edition.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { authors: { hasSome: [query] } }
          ]
        },
        take: limit,
        select: {
          id: true,
          title: true,
          authors: true,
          isbn10: true,
          isbn13: true,
          googleBooksId: true,
          googleBook: {
            select: { imageUrl: true }
          },
          hardcoverBook: {
            select: { imageUrl: true }
          },
          ibdbBook: {
            select: { imageUrl: true }
          }
        }
      })

      const [books, editions] = await Promise.all([booksPromise, editionsPromise])

      // Combine and normalize results
      const results: BookSearchResult[] = []
      const seenIds = new Set<string>()

      // Add books
      for (const book of books) {
        if (!seenIds.has(book.id)) {
          seenIds.add(book.id)
          results.push({
            id: book.id,
            googleId: book.id, // Use book id as googleId for local results
            title: book.title,
            authors: book.authors,
            categories: [],
            imageUrl: undefined,
            subtitle: undefined,
            description: undefined,
            publishedDate: undefined,
            pageCount: undefined,
            isbn10: undefined,
            isbn13: undefined
          })
        }
      }

      // Add editions (avoiding duplicates)
      for (const edition of editions) {
        const uniqueKey = `edition-${edition.id}`
        if (!seenIds.has(uniqueKey)) {
          seenIds.add(uniqueKey)
          results.push({
            id: edition.id,
            googleId: edition.googleBooksId || edition.id,
            title: edition.title || "Unknown Title",
            authors: edition.authors,
            categories: [],
            imageUrl: getEditionCoverUrl(edition),
            subtitle: undefined,
            description: undefined,
            publishedDate: undefined,
            pageCount: undefined,
            isbn10: edition.isbn10 || undefined,
            isbn13: edition.isbn13 || undefined
          })
        }
      }

      return results.slice(0, limit)
    } catch (error) {
      console.error("LocalDatabaseProvider search error:", error)
      return []
    }
  }
}
