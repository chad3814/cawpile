/**
 * Tagged search handler
 * Handles direct lookups using tagged search syntax (ibdb:, hard:, gbid:, isbn:)
 */
import type { SignedBookSearchResult, SearchProviderResult } from '../types'
import type { BookSearchResult } from '@/types/book'
import { IbdbClient, IbdbBook } from '../utils/ibdbClient'
import { HardcoverClient, HardcoverDocument } from '../utils/hardcoverClient'
import { getBookById as getGoogleBookById, searchBooks as searchGoogleBooks } from '@/lib/googleBooks'
import { validateAndNormalizeIsbn } from '../utils/isbnValidator'
import { mergeResults } from '../utils/resultMerger'

/**
 * Response shape for tagged search operations
 */
export interface TaggedSearchResponse {
  books: SignedBookSearchResult[]
  taggedSearch: true
  provider: string
  error?: string
}

/**
 * Provider display names for error messages
 */
const PROVIDER_NAMES: Record<string, string> = {
  ibdb: 'IBDb',
  hardcover: 'Hardcover',
  google: 'Google Books',
  isbn: 'ISBN search'
}

/**
 * Convert IBDb book to BookSearchResult
 */
function ibdbBookToSearchResult(book: IbdbBook): BookSearchResult {
  return {
    id: book.id || `ibdb-${Date.now()}`,
    googleId: book.id || '',
    title: book.title || 'Unknown Title',
    authors: book.authors || [],
    description: book.description,
    publishedDate: book.publishedDate,
    pageCount: book.pageCount,
    categories: book.categories || [],
    imageUrl: book.imageUrl,
    isbn10: book.isbn10,
    isbn13: book.isbn13
  }
}

/**
 * Convert Hardcover document to BookSearchResult
 */
function hardcoverDocToSearchResult(doc: HardcoverDocument): BookSearchResult {
  const isbn10 = doc.isbns?.find(isbn => isbn.length === 10)
  const isbn13 = doc.isbns?.find(isbn => isbn.length === 13)

  return {
    id: String(doc.id) || `hardcover-${Date.now()}`,
    googleId: String(doc.id) || '',
    title: doc.title || 'Unknown Title',
    authors: doc.author_names || [],
    description: doc.description,
    publishedDate: doc.release_date,
    pageCount: doc.pages,
    categories: doc.genres || [],
    imageUrl: doc.image?.url,
    isbn10,
    isbn13
  }
}

/**
 * Wrap a BookSearchResult as a SignedBookSearchResult with sources
 */
function wrapAsSignedResult(book: BookSearchResult, source: string, weight: number): SignedBookSearchResult {
  return {
    ...book,
    sources: [{
      provider: source,
      data: {
        ...book,
        source,
        sourceWeight: weight
      }
    }]
  }
}

/**
 * Convert BookSearchResult to SearchProviderResult for merging
 */
function toProviderResult(book: BookSearchResult, source: string, weight: number): SearchProviderResult {
  return {
    ...book,
    source,
    sourceWeight: weight
  }
}

/**
 * Search IBDb by UUID
 */
async function searchIbdbById(uuid: string): Promise<TaggedSearchResponse> {
  const client = new IbdbClient()
  const book = await client.getBookById(uuid)

  if (!book) {
    return {
      books: [],
      taggedSearch: true,
      provider: 'ibdb',
      error: `Book not found with ID ${uuid} on ${PROVIDER_NAMES.ibdb}`
    }
  }

  const searchResult = ibdbBookToSearchResult(book)
  return {
    books: [wrapAsSignedResult(searchResult, 'ibdb', 4)],
    taggedSearch: true,
    provider: 'ibdb'
  }
}

/**
 * Search Hardcover by numeric ID
 */
async function searchHardcoverById(idStr: string): Promise<TaggedSearchResponse> {
  const id = parseInt(idStr, 10)

  if (isNaN(id) || id <= 0) {
    return {
      books: [],
      taggedSearch: true,
      provider: 'hardcover',
      error: `Invalid Hardcover ID: ${idStr}. ID must be a positive number.`
    }
  }

  const client = new HardcoverClient()
  const doc = await client.getBookById(id)

  if (!doc) {
    return {
      books: [],
      taggedSearch: true,
      provider: 'hardcover',
      error: `Book not found with ID ${idStr} on ${PROVIDER_NAMES.hardcover}`
    }
  }

  const searchResult = hardcoverDocToSearchResult(doc)
  return {
    books: [wrapAsSignedResult(searchResult, 'hardcover', 6)],
    taggedSearch: true,
    provider: 'hardcover'
  }
}

/**
 * Search Google Books by volume ID
 */
async function searchGoogleById(googleId: string): Promise<TaggedSearchResponse> {
  const book = await getGoogleBookById(googleId)

  if (!book) {
    return {
      books: [],
      taggedSearch: true,
      provider: 'google',
      error: `Book not found with ID ${googleId} on ${PROVIDER_NAMES.google}`
    }
  }

  return {
    books: [wrapAsSignedResult(book, 'google', 5)],
    taggedSearch: true,
    provider: 'google'
  }
}

/**
 * Search all providers by ISBN
 */
async function searchByIsbn(rawIsbn: string): Promise<TaggedSearchResponse> {
  const normalizedIsbn = validateAndNormalizeIsbn(rawIsbn)

  if (!normalizedIsbn) {
    return {
      books: [],
      taggedSearch: true,
      provider: 'isbn',
      error: `Invalid ISBN format: ${rawIsbn}. ISBN must be 10 or 13 digits.`
    }
  }

  // Search all providers in parallel
  const ibdbClient = new IbdbClient()
  const hardcoverClient = new HardcoverClient()

  const [ibdbResults, hardcoverResults, googleResults] = await Promise.allSettled([
    ibdbClient.search(normalizedIsbn),
    hardcoverClient.search(normalizedIsbn, 10),
    searchGoogleBooks(`isbn:${normalizedIsbn}`, 10)
  ])

  // Collect results from all providers
  const providerResults: SearchProviderResult[][] = []

  // Process IBDb results
  if (ibdbResults.status === 'fulfilled' && ibdbResults.value.length > 0) {
    providerResults.push(
      ibdbResults.value.map(book => toProviderResult(ibdbBookToSearchResult(book), 'ibdb', 4))
    )
  }

  // Process Hardcover results
  if (hardcoverResults.status === 'fulfilled' && hardcoverResults.value.length > 0) {
    providerResults.push(
      hardcoverResults.value.map(doc => toProviderResult(hardcoverDocToSearchResult(doc), 'hardcover', 6))
    )
  }

  // Process Google results
  if (googleResults.status === 'fulfilled' && googleResults.value.length > 0) {
    providerResults.push(
      googleResults.value.map(book => toProviderResult(book, 'google', 5))
    )
  }

  // Merge results from all providers
  const mergedBooks = mergeResults(providerResults, 10)

  if (mergedBooks.length === 0) {
    return {
      books: [],
      taggedSearch: true,
      provider: 'isbn',
      error: `No books found with ISBN ${normalizedIsbn}`
    }
  }

  return {
    books: mergedBooks,
    taggedSearch: true,
    provider: 'isbn'
  }
}

/**
 * Handle tagged search requests
 * Routes to appropriate provider based on tag type
 *
 * @param tag - The tag type (ibdb, hard, gbid, isbn)
 * @param value - The ID or ISBN value to search
 * @returns Tagged search response with results or error
 */
export async function handleTaggedSearch(tag: string, value: string): Promise<TaggedSearchResponse> {
  switch (tag) {
    case 'ibdb':
      return searchIbdbById(value)

    case 'hard':
      return searchHardcoverById(value)

    case 'gbid':
      return searchGoogleById(value)

    case 'isbn':
      return searchByIsbn(value)

    default:
      return {
        books: [],
        taggedSearch: true,
        provider: tag,
        error: `Unknown tag type: ${tag}`
      }
  }
}
