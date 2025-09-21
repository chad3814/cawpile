import type { SearchProviderResult } from "../types"
import type { BookSearchResult } from "@/types/book"
import { fuzzyMatchAuthors, fuzzyMatchTitle } from "./fuzzyMatch"

interface MergedResult {
  primary: SearchProviderResult
  duplicates: SearchProviderResult[]
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
 * Merge and deduplicate results from multiple search providers
 */
export function mergeResults(providerResults: SearchProviderResult[][], limit: number): BookSearchResult[] {
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

  // Sort merged results by weight and select primary
  const finalResults: SearchProviderResult[] = mergedResults.map(merged => {
    // Sort duplicates by weight (highest first)
    const allVersions = [merged.primary, ...merged.duplicates].sort((a, b) => b.sourceWeight - a.sourceWeight)

    // Use highest weight as primary, but prioritize local source
    const localVersion = allVersions.find(v => v.source === "local")
    const primary = localVersion || allVersions[0]

    // Augment primary with data from other versions
    const others = allVersions.filter(v => v !== primary)
    return augmentResult(primary, others)
  })

  // Sort by source weight (highest first)
  finalResults.sort((a, b) => b.sourceWeight - a.sourceWeight)

  // Limit results and remove source metadata for final output
  return finalResults.slice(0, limit).map(result => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { source, sourceWeight, ...bookResult } = result
    return bookResult as BookSearchResult
  })
}