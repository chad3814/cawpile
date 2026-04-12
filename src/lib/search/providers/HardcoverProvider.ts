import { BaseSearchProvider } from "../BaseSearchProvider"
import type { BookSearchResult } from "@/types/book"
import { HardcoverClient } from "../utils/hardcoverClient"

export class HardcoverProvider extends BaseSearchProvider {
  private client: HardcoverClient

  constructor() {
    super({
      name: "hardcover",
      weight: 7,
      timeout: 5000
    })
    this.client = new HardcoverClient()
  }

  protected async searchInternal(query: string, limit: number): Promise<BookSearchResult[]> {
    try {
      const hardcoverBooks = await this.client.search(query, limit)

      // Normalize Hardcover results to our format
      const results: BookSearchResult[] = hardcoverBooks.map(book => {
        // Extract ISBN-10 and ISBN-13 from isbns array
        const isbn10 = book.isbns?.find(isbn => isbn.length === 10)
        const isbn13 = book.isbns?.find(isbn => isbn.length === 13)

        return {
          id: book.id ? String(book.id) : `hardcover-${Date.now()}-${Math.random()}`,
          googleId: book.id ? String(book.id) : "",
          title: book.title || "Unknown Title",
          authors: book.author_names || [],
          description: book.description,
          publishedDate: book.release_date,
          pageCount: book.pages,
          categories: book.genres || [],
          imageUrl: book.image?.url,
          isbn10,
          isbn13
        }
      })

      return results
    } catch (error) {
      console.error("HardcoverProvider search error:", error)
      return []
    }
  }
}
