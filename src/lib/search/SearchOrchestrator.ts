import type { SearchProvider, SearchProviderResult, ProviderSearchResponse } from "./types"
import type { BookSearchResult } from "@/types/book"
import { mergeResults } from "./utils/resultMerger"

export class SearchOrchestrator {
  private providers: SearchProvider[] = []

  /**
   * Register a search provider
   */
  registerProvider(provider: SearchProvider): void {
    this.providers.push(provider)
    console.log(`Registered search provider: ${provider.name} (weight: ${provider.weight})`)
  }

  /**
   * Search across all registered providers in parallel
   */
  async search(query: string, limit: number = 10): Promise<BookSearchResult[]> {
    if (this.providers.length === 0) {
      console.warn("No search providers registered")
      return []
    }

    // Execute all providers in parallel with individual timeout handling
    const searchPromises = this.providers.map(async (provider): Promise<ProviderSearchResponse> => {
      try {
        const results = await provider.search(query, limit)
        return {
          provider: provider.name,
          results: results as SearchProviderResult[],
        }
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error)
        return {
          provider: provider.name,
          results: [],
          error: error as Error
        }
      }
    })

    // Wait for all providers to complete or timeout
    const providerResponses = await Promise.allSettled(searchPromises)

    // Collect successful results
    const allResults: SearchProviderResult[][] = []

    for (const response of providerResponses) {
      if (response.status === "fulfilled" && response.value.results.length > 0) {
        allResults.push(response.value.results)
      } else if (response.status === "rejected") {
        console.error("Provider promise rejected:", response.reason)
      }
    }

    // If no results from any provider
    if (allResults.length === 0) {
      return []
    }

    // Merge and deduplicate results
    const mergedResults = mergeResults(allResults, limit)

    return mergedResults
  }

  /**
   * Get list of registered providers
   */
  getProviders(): string[] {
    return this.providers.map(p => `${p.name} (weight: ${p.weight})`)
  }
}