import { BaseSearchProvider } from "../BaseSearchProvider"
import type { BookSearchResult } from "@/types/book"
import { HardcoverClient } from "../utils/hardcoverClient"

export class HardcoverProvider extends BaseSearchProvider {
  private client: HardcoverClient

  constructor() {
    super({
      name: "hardcover",
      weight: 6,
      timeout: 5000
    })
    this.client = new HardcoverClient()
  }

  protected async searchInternal(query: string, limit: number): Promise<BookSearchResult[]> {
    try {
      const hardcoverBooks = await this.client.search(query, limit)

      // Normalize Hardcover results to our format
      const results: BookSearchResult[] = hardcoverBooks.map(book => ({
        id: book.id || `hardcover-${Date.now()}-${Math.random()}`,
        googleId: book.id || "",
        title: book.title || "Unknown Title",
        subtitle: book.subtitle,
        authors: book.authors?.map(a => a.name).filter((name): name is string => !!name) || [],
        description: book.description,
        publishedDate: book.release_date,
        pageCount: book.pages,
        categories: book.categories?.map(c => c.name).filter((name): name is string => !!name) || [],
        imageUrl: book.image,
        isbn10: book.isbn,
        isbn13: book.isbn13
      }))

      return results
    } catch (error) {
      console.error("HardcoverProvider search error:", error)
      return []
    }
  }
}