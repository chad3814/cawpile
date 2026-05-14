import { BaseSearchProvider } from "../BaseSearchProvider"
import type { BookSearchResult } from "@/types/book"
import { prisma } from "@/lib/prisma"

/**
 * Get cover image URL from edition provider relations with fallback logic
 * Priority: Hardcover > Google > IBDB > Amazon
 */
function getEditionCoverUrl(edition: {
  hardcoverBook?: { imageUrl: string | null } | null
  googleBook?: { imageUrl: string | null } | null
  ibdbBook?: { imageUrl: string | null } | null
  amazonBook?: { imageUrl: string | null } | null
}): string | undefined {
  return (
    edition.hardcoverBook?.imageUrl ||
    edition.googleBook?.imageUrl ||
    edition.ibdbBook?.imageUrl ||
    edition.amazonBook?.imageUrl ||
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
      // Search Books table, eager-loading the first Edition's provider
      // covers so Book-matched results still get an imageUrl (otherwise any
      // book without an Edition.title — i.e. most books — renders the
      // placeholder).
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
          authors: true,
          editions: {
            take: 1,
            select: {
              isbn10: true,
              isbn13: true,
              googleBooksId: true,
              googleBook: { select: { imageUrl: true } },
              hardcoverBook: { select: { imageUrl: true } },
              ibdbBook: { select: { imageUrl: true } },
              amazonBook: { select: { imageUrl: true } }
            }
          }
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
          },
          amazonBook: {
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
          const firstEdition = book.editions[0]
          results.push({
            id: book.id,
            googleId: firstEdition?.googleBooksId || book.id,
            title: book.title,
            authors: book.authors,
            categories: [],
            imageUrl: firstEdition ? getEditionCoverUrl(firstEdition) : undefined,
            subtitle: undefined,
            description: undefined,
            publishedDate: undefined,
            pageCount: undefined,
            isbn10: firstEdition?.isbn10 || undefined,
            isbn13: firstEdition?.isbn13 || undefined
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
