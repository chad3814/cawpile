import prisma from '@/lib/prisma'
import { BookSearchResult } from '@/types/book'
import { Prisma, Edition, GoogleBook, HardcoverBook, IbdbBook } from '@prisma/client'
import { detectBookType } from '@/lib/bookTypeDetection'
import type { SignedBookSearchResult, SourceEntry, SearchProviderResult } from '@/lib/search/types'
import { verifySignature } from '@/lib/search/utils/signResult'

/**
 * Status returned for each provider after upsert operation
 */
export type ProviderUpsertStatus = 'created' | 'updated' | 'unchanged' | null

/**
 * Result of upserting all provider records
 */
export interface UpsertAllProvidersResult {
  google: ProviderUpsertStatus
  hardcover: ProviderUpsertStatus
  ibdb: ProviderUpsertStatus
}

export async function findOrCreateBook(
  title: string,
  authors: string[],
  language: string = 'en',
  categories?: string[]
) {
  // First try to find existing book
  const existingBook = await prisma.book.findFirst({
    where: {
      title,
      authors: {
        equals: authors
      }
    }
  })

  if (existingBook) {
    return existingBook
  }

  // Detect book type based on categories
  const bookType = detectBookType(categories)

  // Create new book
  return await prisma.book.create({
    data: {
      title,
      authors,
      language,
      bookType
    }
  })
}

/**
 * Map a Hardcover source entry to Prisma HardcoverBook create input
 */
function mapHardcoverSource(source: SourceEntry, editionId: string): Prisma.HardcoverBookCreateInput {
  const data = source.data as SearchProviderResult & {
    hardcoverSlug?: string
    openLibraryId?: string
    goodReadsId?: string
  }

  return {
    hardcoverId: data.id || `hardcover-${Date.now()}`,
    edition: { connect: { id: editionId } },
    title: data.title || 'Unknown Title',
    subtitle: data.subtitle || null,
    authors: data.authors || [],
    description: data.description || null,
    releaseDate: data.publishedDate || null,
    pages: data.pageCount || null,
    imageUrl: data.imageUrl || null,
    categories: data.categories || [],
    isbn: data.isbn10 || null,
    isbn13: data.isbn13 || null,
    hardcoverSlug: data.hardcoverSlug || null,
    openLibraryId: data.openLibraryId || null,
    goodReadsId: data.goodReadsId || null,
  }
}

/**
 * Map an IBDB source entry to Prisma IbdbBook create input
 */
function mapIbdbSource(source: SourceEntry, editionId: string): Prisma.IbdbBookCreateInput {
  const data = source.data as SearchProviderResult

  return {
    ibdbId: data.id || `ibdb-${Date.now()}`,
    edition: { connect: { id: editionId } },
    title: data.title || 'Unknown Title',
    authors: data.authors || [],
    description: data.description || null,
    publishedDate: data.publishedDate || null,
    pageCount: data.pageCount || null,
    imageUrl: data.imageUrl || null,
    categories: data.categories || [],
    isbn10: data.isbn10 || null,
    isbn13: data.isbn13 || null,
  }
}

/**
 * Create or update provider records for an edition based on verified sources
 */
async function upsertProviderRecords(
  editionId: string,
  sources: SourceEntry[]
): Promise<{ hardcover: 'created' | 'updated' | 'unchanged' | null; ibdb: 'created' | 'updated' | 'unchanged' | null }> {
  const result: { hardcover: 'created' | 'updated' | 'unchanged' | null; ibdb: 'created' | 'updated' | 'unchanged' | null } = {
    hardcover: null,
    ibdb: null
  }

  for (const source of sources) {
    if (source.provider === 'hardcover') {
      try {
        const data = mapHardcoverSource(source, editionId)

        // Check if record exists
        const existing = await prisma.hardcoverBook.findUnique({
          where: { editionId }
        })

        if (existing) {
          // Update existing record
          await prisma.hardcoverBook.update({
            where: { editionId },
            data: {
              title: data.title,
              subtitle: data.subtitle,
              authors: data.authors,
              description: data.description,
              releaseDate: data.releaseDate,
              pages: data.pages,
              imageUrl: data.imageUrl,
              categories: data.categories,
              isbn: data.isbn,
              isbn13: data.isbn13,
              hardcoverSlug: data.hardcoverSlug,
              openLibraryId: data.openLibraryId,
              goodReadsId: data.goodReadsId,
            }
          })
          result.hardcover = 'updated'
        } else {
          // Create new record
          await prisma.hardcoverBook.create({ data })
          result.hardcover = 'created'
        }
      } catch (error) {
        console.error('Failed to upsert HardcoverBook:', error)
      }
    }

    if (source.provider === 'ibdb') {
      try {
        const data = mapIbdbSource(source, editionId)

        // Check if record exists
        const existing = await prisma.ibdbBook.findUnique({
          where: { editionId }
        })

        if (existing) {
          // Update existing record
          await prisma.ibdbBook.update({
            where: { editionId },
            data: {
              title: data.title,
              authors: data.authors,
              description: data.description,
              publishedDate: data.publishedDate,
              pageCount: data.pageCount,
              imageUrl: data.imageUrl,
              categories: data.categories,
              isbn10: data.isbn10,
              isbn13: data.isbn13,
            }
          })
          result.ibdb = 'updated'
        } else {
          // Create new record
          await prisma.ibdbBook.create({ data })
          result.ibdb = 'created'
        }
      } catch (error) {
        console.error('Failed to upsert IbdbBook:', error)
      }
    }
  }

  return result
}

export async function findOrCreateEdition(
  bookId: string,
  googleData: BookSearchResult,
  signedResult?: SignedBookSearchResult
) {
  // Check if edition exists by ISBN or Google Books ID
  const whereConditions: Prisma.EditionWhereInput[] = []

  if (googleData.googleId) {
    whereConditions.push({ googleBooksId: googleData.googleId })
  }

  if (googleData.isbn10) {
    whereConditions.push({ isbn10: googleData.isbn10 })
  }

  if (googleData.isbn13) {
    whereConditions.push({ isbn13: googleData.isbn13 })
  }

  let existingEdition: Edition | null = null

  if (whereConditions.length > 0) {
    existingEdition = await prisma.edition.findFirst({
      where: {
        OR: whereConditions
      }
    })

    if (existingEdition) {
      // If we have a signed result, try to upsert provider records
      if (signedResult) {
        await handleSignedResult(existingEdition.id, signedResult)
      }
      return existingEdition
    }
  }

  // Create new edition with Google Books data
  const edition = await prisma.edition.create({
    data: {
      bookId,
      isbn10: googleData.isbn10,
      isbn13: googleData.isbn13,
      title: googleData.subtitle ? `${googleData.title}: ${googleData.subtitle}` : null,
      authors: googleData.authors,
      googleBooksId: googleData.googleId,
      googleBook: {
        create: {
          googleId: googleData.googleId,
          title: googleData.title,
          subtitle: googleData.subtitle,
          authors: googleData.authors,
          description: googleData.description,
          publishedDate: googleData.publishedDate,
          pageCount: googleData.pageCount,
          imageUrl: googleData.imageUrl,
          categories: googleData.categories
        }
      }
    }
  })

  // If we have a signed result, try to create provider records
  if (signedResult) {
    await handleSignedResult(edition.id, signedResult)
  }

  return edition
}

/**
 * Handle signed result by verifying signature and upserting provider records
 */
async function handleSignedResult(
  editionId: string,
  signedResult: SignedBookSearchResult
): Promise<{ hardcover: 'created' | 'updated' | 'unchanged' | null; ibdb: 'created' | 'updated' | 'unchanged' | null }> {
  // Check if sources array exists
  if (!signedResult.sources || signedResult.sources.length === 0) {
    console.warn('No sources array in signed result, skipping multi-provider save')
    return { hardcover: null, ibdb: null }
  }

  // Check if signature is present
  if (!signedResult.signature) {
    console.warn('Unverified sources array (no signature), skipping multi-provider save')
    return { hardcover: null, ibdb: null }
  }

  // Verify signature
  if (!verifySignature(signedResult)) {
    console.warn('Signature verification failed, skipping multi-provider save')
    return { hardcover: null, ibdb: null }
  }

  // Signature verified, upsert provider records
  return await upsertProviderRecords(editionId, signedResult.sources)
}

/**
 * Type for edition with all provider relations
 */
export type EditionWithProviders = Edition & {
  googleBook: GoogleBook | null
  hardcoverBook: HardcoverBook | null
  ibdbBook: IbdbBook | null
}

/**
 * Enriched book data with all merged fields and source tracking
 */
export interface EnrichedBookData {
  title: string
  subtitle: string | null
  authors: string[]
  description: string | null
  publishedDate: string | null
  pageCount: number | null
  imageUrl: string | null
  categories: string[]
  isbn10: string | null
  isbn13: string | null
  dataSource: Record<string, string>
}

/**
 * Get enriched book data by merging fields from multiple providers
 * Priority order: Edition (local edits) > Hardcover > GoogleBooks > IBDB
 */
export function getEnrichedBookData(edition: EditionWithProviders): EnrichedBookData {
  const dataSource: Record<string, string> = {}

  // Helper to get first non-null value with priority
  function getField<T>(
    fieldName: string,
    editionValue: T | null | undefined,
    hardcoverValue: T | null | undefined,
    googleValue: T | null | undefined,
    ibdbValue: T | null | undefined
  ): T | null {
    if (editionValue !== null && editionValue !== undefined) {
      // Check if it's an array and if it's non-empty
      if (Array.isArray(editionValue) && editionValue.length === 0) {
        // Fall through to next provider
      } else {
        dataSource[fieldName] = 'edition'
        return editionValue
      }
    }
    if (hardcoverValue !== null && hardcoverValue !== undefined) {
      if (Array.isArray(hardcoverValue) && hardcoverValue.length === 0) {
        // Fall through to next provider
      } else {
        dataSource[fieldName] = 'hardcover'
        return hardcoverValue
      }
    }
    if (googleValue !== null && googleValue !== undefined) {
      if (Array.isArray(googleValue) && googleValue.length === 0) {
        // Fall through to next provider
      } else {
        dataSource[fieldName] = 'google'
        return googleValue
      }
    }
    if (ibdbValue !== null && ibdbValue !== undefined) {
      if (Array.isArray(ibdbValue) && ibdbValue.length === 0) {
        // Fall through to null
      } else {
        dataSource[fieldName] = 'ibdb'
        return ibdbValue
      }
    }
    return null
  }

  const { googleBook, hardcoverBook, ibdbBook } = edition

  // For title, the edition title might be a combined title:subtitle, so handle specially
  let title = edition.title
  if (!title && hardcoverBook?.title) {
    title = hardcoverBook.title
    dataSource['title'] = 'hardcover'
  } else if (!title && googleBook?.title) {
    title = googleBook.title
    dataSource['title'] = 'google'
  } else if (!title && ibdbBook?.title) {
    title = ibdbBook.title
    dataSource['title'] = 'ibdb'
  } else if (title) {
    dataSource['title'] = 'edition'
  }

  return {
    title: title || 'Unknown Title',
    subtitle: getField(
      'subtitle',
      null, // Edition doesn't have separate subtitle
      hardcoverBook?.subtitle,
      googleBook?.subtitle,
      null // IBDB doesn't have subtitle
    ),
    authors: getField(
      'authors',
      edition.authors.length > 0 ? edition.authors : null,
      hardcoverBook?.authors,
      googleBook?.authors,
      ibdbBook?.authors
    ) || [],
    description: getField(
      'description',
      null, // Edition doesn't have description
      hardcoverBook?.description,
      googleBook?.description,
      ibdbBook?.description
    ),
    publishedDate: getField(
      'publishedDate',
      null, // Edition doesn't have publishedDate
      hardcoverBook?.releaseDate,
      googleBook?.publishedDate,
      ibdbBook?.publishedDate
    ),
    pageCount: getField(
      'pageCount',
      null, // Edition doesn't have pageCount
      hardcoverBook?.pages,
      googleBook?.pageCount,
      ibdbBook?.pageCount
    ),
    imageUrl: getField(
      'imageUrl',
      null, // Edition doesn't have imageUrl
      hardcoverBook?.imageUrl,
      googleBook?.imageUrl,
      ibdbBook?.imageUrl
    ),
    categories: getField(
      'categories',
      null, // Edition doesn't have categories
      hardcoverBook?.categories,
      googleBook?.categories,
      ibdbBook?.categories
    ) || [],
    isbn10: edition.isbn10 || hardcoverBook?.isbn || ibdbBook?.isbn10 || null,
    isbn13: edition.isbn13 || hardcoverBook?.isbn13 || ibdbBook?.isbn13 || null,
    dataSource
  }
}

/**
 * Map a Google source entry to Prisma GoogleBook create input
 */
function mapGoogleSource(source: SourceEntry, editionId: string): Prisma.GoogleBookCreateInput {
  const data = source.data as SearchProviderResult

  return {
    googleId: data.googleId || data.id || `google-${Date.now()}`,
    edition: { connect: { id: editionId } },
    title: data.title || 'Unknown Title',
    subtitle: data.subtitle || null,
    authors: data.authors || [],
    description: data.description || null,
    publishedDate: data.publishedDate || null,
    pageCount: data.pageCount || null,
    imageUrl: data.imageUrl || null,
    categories: data.categories || [],
  }
}

/**
 * Create edition and all provider records from a verified signed result
 * This function assumes the signature has already been verified
 */
export async function findOrCreateEditionFromSignedResult(
  bookId: string,
  signedResult: SignedBookSearchResult
): Promise<Edition> {
  // Build where conditions to find existing edition
  const whereConditions: Prisma.EditionWhereInput[] = []

  // Check for google source to get googleBooksId
  const googleSource = signedResult.sources.find(s => s.provider === 'google')
  const googleId = googleSource?.data?.googleId || googleSource?.data?.id || signedResult.googleId

  if (googleId) {
    whereConditions.push({ googleBooksId: googleId })
  }

  if (signedResult.isbn10) {
    whereConditions.push({ isbn10: signedResult.isbn10 })
  }

  if (signedResult.isbn13) {
    whereConditions.push({ isbn13: signedResult.isbn13 })
  }

  // Try to find existing edition
  let existingEdition: Edition | null = null

  if (whereConditions.length > 0) {
    existingEdition = await prisma.edition.findFirst({
      where: {
        OR: whereConditions
      }
    })

    if (existingEdition) {
      // Update provider records for existing edition
      await upsertAllProviderRecords(existingEdition.id, signedResult.sources)
      return existingEdition
    }
  }

  // Create new edition
  const edition = await prisma.edition.create({
    data: {
      bookId,
      isbn10: signedResult.isbn10 || null,
      isbn13: signedResult.isbn13 || null,
      title: signedResult.subtitle
        ? `${signedResult.title}: ${signedResult.subtitle}`
        : signedResult.title || null,
      authors: signedResult.authors || [],
      googleBooksId: googleId || null,
    }
  })

  // Create all provider records
  await upsertAllProviderRecords(edition.id, signedResult.sources)

  return edition
}

/**
 * Create or update all provider records (Google, Hardcover, IBDB) for an edition
 * Returns status for each provider indicating if the record was created, updated, unchanged, or not found
 */
export async function upsertAllProviderRecords(
  editionId: string,
  sources: SourceEntry[]
): Promise<UpsertAllProvidersResult> {
  const result: UpsertAllProvidersResult = {
    google: null,
    hardcover: null,
    ibdb: null
  }

  for (const source of sources) {
    try {
      if (source.provider === 'google') {
        const existing = await prisma.googleBook.findUnique({
          where: { editionId }
        })

        if (existing) {
          const data = mapGoogleSource(source, editionId)
          await prisma.googleBook.update({
            where: { editionId },
            data: {
              title: data.title,
              subtitle: data.subtitle,
              authors: data.authors,
              description: data.description,
              publishedDate: data.publishedDate,
              pageCount: data.pageCount,
              imageUrl: data.imageUrl,
              categories: data.categories,
            }
          })
          result.google = 'updated'
        } else {
          await prisma.googleBook.create({
            data: mapGoogleSource(source, editionId)
          })
          result.google = 'created'
        }
      } else if (source.provider === 'hardcover') {
        const existing = await prisma.hardcoverBook.findUnique({
          where: { editionId }
        })

        if (existing) {
          const data = mapHardcoverSource(source, editionId)
          await prisma.hardcoverBook.update({
            where: { editionId },
            data: {
              title: data.title,
              subtitle: data.subtitle,
              authors: data.authors,
              description: data.description,
              releaseDate: data.releaseDate,
              pages: data.pages,
              imageUrl: data.imageUrl,
              categories: data.categories,
              isbn: data.isbn,
              isbn13: data.isbn13,
              hardcoverSlug: data.hardcoverSlug,
              openLibraryId: data.openLibraryId,
              goodReadsId: data.goodReadsId,
            }
          })
          result.hardcover = 'updated'
        } else {
          await prisma.hardcoverBook.create({
            data: mapHardcoverSource(source, editionId)
          })
          result.hardcover = 'created'
        }
      } else if (source.provider === 'ibdb') {
        const existing = await prisma.ibdbBook.findUnique({
          where: { editionId }
        })

        if (existing) {
          const data = mapIbdbSource(source, editionId)
          await prisma.ibdbBook.update({
            where: { editionId },
            data: {
              title: data.title,
              authors: data.authors,
              description: data.description,
              publishedDate: data.publishedDate,
              pageCount: data.pageCount,
              imageUrl: data.imageUrl,
              categories: data.categories,
              isbn10: data.isbn10,
              isbn13: data.isbn13,
            }
          })
          result.ibdb = 'updated'
        } else {
          await prisma.ibdbBook.create({
            data: mapIbdbSource(source, editionId)
          })
          result.ibdb = 'created'
        }
      }
      // Skip 'local' provider - it's already in our database
    } catch (error) {
      console.error(`Failed to upsert ${source.provider} record:`, error)
    }
  }

  return result
}

/**
 * Export upsert function for use in re-sync API
 */
export { upsertProviderRecords }
