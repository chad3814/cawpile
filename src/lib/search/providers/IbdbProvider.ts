import { BaseSearchProvider } from "../BaseSearchProvider"
import type { BookSearchResult } from "@/types/book"
import { IbdbClient } from "../utils/ibdbClient"

export class IbdbProvider extends BaseSearchProvider {
  private client: IbdbClient

  constructor() {
    super({
      name: "ibdb",
      weight: 6,
      timeout: 5000
    })
    this.client = new IbdbClient()
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
