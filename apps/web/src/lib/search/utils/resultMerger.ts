import type { SearchProviderResult, SourceEntry, SignedBookSearchResult } from "../types"
import type { BookSearchResult } from "@/types/book"
import { fuzzyMatchAuthors, fuzzyMatchTitle } from "./fuzzyMatch"
import { signResults } from "./signResult"

interface MergedResult {
  primary: SearchProviderResult
  duplicates: SearchProviderResult[]
}

/**
 * Intermediate type to hold augmented result alongside sources
 */
interface AugmentedResultWithSources {
  augmented: SearchProviderResult
  sources: SourceEntry[]
}

/**
 * Check if two books are the same based on ISBN
 */
function isSameBookByISBN(book1: SearchProviderResult, book2: SearchProviderResult): boolean {
  // Check ISBN-13 match
  if (book1.isbn13 && book2.isbn13 && book1.isbn13 === book2.isbn13) {
    return true
  }

  // Check ISBN-10 match
  if (book1.isbn10 && book2.isbn10 && book1.isbn10 === book2.isbn10) {
    return true
  }

  return false
}

/**
 * Check if two books are the same based on title and author with fuzzy matching
 */
function isSameBookByTitleAuthor(book1: SearchProviderResult, book2: SearchProviderResult): boolean {
  const titleMatch = fuzzyMatchTitle(book1.title, book2.title)
  const authorMatch = fuzzyMatchAuthors(book1.authors, book2.authors)

  return titleMatch && authorMatch
}

/**
 * Augment primary result with missing data from duplicates
 */
function augmentResult(primary: SearchProviderResult, duplicates: SearchProviderResult[]): SearchProviderResult {
  const augmented = { ...primary }

  for (const duplicate of duplicates) {
    // Augment missing fields
    if (!augmented.subtitle && duplicate.subtitle) {
      augmented.subtitle = duplicate.subtitle
    }
    if (!augmented.description && duplicate.description) {
      augmented.description = duplicate.description
    }
    if (!augmented.publishedDate && duplicate.publishedDate) {
      augmented.publishedDate = duplicate.publishedDate
    }
    if (!augmented.pageCount && duplicate.pageCount) {
      augmented.pageCount = duplicate.pageCount
    }
    if (!augmented.imageUrl && duplicate.imageUrl) {
      augmented.imageUrl = duplicate.imageUrl
    }
    if (!augmented.isbn10 && duplicate.isbn10) {
      augmented.isbn10 = duplicate.isbn10
    }
    if (!augmented.isbn13 && duplicate.isbn13) {
      augmented.isbn13 = duplicate.isbn13
    }
    if (!augmented.categories.length && duplicate.categories.length) {
      augmented.categories = duplicate.categories
    }
  }

  return augmented
}

/**
 * Build sources array from all versions, sorted by weight (highest first)
 */
function buildSourcesArray(allVersions: SearchProviderResult[]): SourceEntry[] {
  // Sort by sourceWeight (highest first) and map to SourceEntry
  return [...allVersions]
    .sort((a, b) => b.sourceWeight - a.sourceWeight)
    .map((version) => ({
      provider: version.source,
      data: version,
    }))
}

/**
 * Merge and deduplicate results from multiple search providers
 * Returns signed results with source provenance
 */
export function mergeResults(providerResults: SearchProviderResult[][], limit: number): SignedBookSearchResult[] {
  // Flatten all results
  const allResults = providerResults.flat()

  if (allResults.length === 0) {
    return []
  }

  // Group duplicates
  const mergedResults: MergedResult[] = []

  for (const result of allResults) {
    let foundDuplicate = false

    for (const merged of mergedResults) {
      // Check if this result is a duplicate of an existing merged result
      if (isSameBookByISBN(result, merged.primary) || isSameBookByTitleAuthor(result, merged.primary)) {
        merged.duplicates.push(result)
        foundDuplicate = true
        break
      }
    }

    if (!foundDuplicate) {
      mergedResults.push({
        primary: result,
        duplicates: []
      })
    }
  }

  // Sort merged results by weight, select primary, and build sources array
  const resultsWithSources: AugmentedResultWithSources[] = mergedResults.map(merged => {
    // Sort duplicates by weight (highest first)
    const allVersions = [merged.primary, ...merged.duplicates].sort((a, b) => b.sourceWeight - a.sourceWeight)

    // Use highest weight as primary, but prioritize local source
    const localVersion = allVersions.find(v => v.source === "local")
    const primary = localVersion || allVersions[0]

    // Augment primary with data from other versions
    const others = allVersions.filter(v => v !== primary)
    const augmented = augmentResult(primary, others)

    // Build sources array from all versions
    const sources = buildSourcesArray(allVersions)

    return { augmented, sources }
  })

  // Sort by source weight (highest first)
  resultsWithSources.sort((a, b) => b.augmented.sourceWeight - a.augmented.sourceWeight)

  // Limit results, add sources, and strip source metadata from primary fields
  const resultsToSign = resultsWithSources.slice(0, limit).map(({ augmented, sources }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { source, sourceWeight, ...bookResult } = augmented
    return {
      ...(bookResult as BookSearchResult),
      sources,
    }
  })

  // Sign all results and return
  return signResults(resultsToSign)
}
