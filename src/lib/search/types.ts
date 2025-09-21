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