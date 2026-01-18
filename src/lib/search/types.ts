import type { BookSearchResult } from "@/types/book"

export interface SearchProvider {
  name: string
  weight: number
  timeout: number
  search(query: string, limit: number): Promise<BookSearchResult[]>
}

export interface SearchProviderResult extends BookSearchResult {
  source: string
  sourceWeight: number
}

/**
 * Represents a single source entry in a merged search result
 * Contains the provider name and the original data from that provider
 */
export interface SourceEntry {
  provider: string
  data: SearchProviderResult
}

/**
 * Extended search result that includes source provenance and cryptographic signature
 * Used for merged results where multiple providers may have contributed data
 */
export interface SignedBookSearchResult extends BookSearchResult {
  sources: SourceEntry[]
  signature?: string
}

export interface ProviderConfig {
  name: string
  weight: number
  timeout?: number
}

export type ProviderSearchResponse = {
  provider: string
  results: SearchProviderResult[]
  error?: Error
}
