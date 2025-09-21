import { BaseSearchProvider } from "../BaseSearchProvider"
import type { BookSearchResult } from "@/types/book"
import { searchBooks } from "@/lib/googleBooks"

export class GoogleBooksProvider extends BaseSearchProvider {
  constructor() {
    super({
      name: "google",
      weight: 5,
      timeout: 5000
    })
  }

  protected async searchInternal(query: string, limit: number): Promise<BookSearchResult[]> {
    try {
      const results = await searchBooks(query, limit)
      return results
    } catch (error) {
      console.error("GoogleBooksProvider search error:", error)
      return []
    }
  }
}