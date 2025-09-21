import { BaseSearchProvider } from "../BaseSearchProvider"
import type { BookSearchResult } from "@/types/book"
import { IBDBClient } from "../utils/ibdbClient"

export class IBDBProvider extends BaseSearchProvider {
  private client: IBDBClient

  constructor() {
    super({
      name: "ibdb",
      weight: 4,
      timeout: 5000
    })
    this.client = new IBDBClient()
  }

  protected async searchInternal(query: string, limit: number): Promise<BookSearchResult[]> {
    try {
      const ibdbBooks = await this.client.search(query)

      // Normalize IBDB results to our format
      const results: BookSearchResult[] = ibdbBooks.slice(0, limit).map(book => ({
        id: book.id || `ibdb-${Date.now()}-${Math.random()}`,
        googleId: book.id || "",
        title: book.title || "Unknown Title",
        subtitle: undefined,
        authors: book.authors || [],
        description: book.description,
        publishedDate: book.publishedDate,
        pageCount: book.pageCount,
        categories: book.categories || [],
        imageUrl: book.imageUrl,
        isbn10: book.isbn10,
        isbn13: book.isbn13
      }))

      return results
    } catch (error) {
      console.error("IBDBProvider search error:", error)
      return []
    }
  }
}