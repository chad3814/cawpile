import type { SearchProvider, SearchProviderResult, ProviderConfig } from "./types"
import type { BookSearchResult } from "@/types/book"

export abstract class BaseSearchProvider implements SearchProvider {
  public readonly name: string
  public readonly weight: number
  public readonly timeout: number

  constructor(config: ProviderConfig) {
    this.name = config.name
    this.weight = config.weight
    this.timeout = config.timeout || 5000
  }

  protected abstract searchInternal(query: string, limit: number): Promise<BookSearchResult[]>

  async search(query: string, limit: number): Promise<BookSearchResult[]> {
    try {
      const timeoutPromise = new Promise<BookSearchResult[]>((_, reject) => {
        setTimeout(() => reject(new Error(`${this.name} search timeout`)), this.timeout)
      })

      const searchPromise = this.searchInternal(query, limit)

      const results = await Promise.race([searchPromise, timeoutPromise])

      // Add source metadata to results
      return results.map(result => ({
        ...result,
        source: this.name,
        sourceWeight: this.weight
      } as SearchProviderResult))
    } catch (error) {
      console.error(`${this.name} search error:`, error)
      return []
    }
  }
}