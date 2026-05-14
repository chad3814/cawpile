import prisma from '@/lib/prisma'
import { BookSearchResult } from '@/types/book'
import { Prisma, Edition } from '@prisma/client'
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
  amazon: ProviderUpsertStatus
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
 * Map an Amazon source entry to Prisma AmazonBook create input
 */
function mapAmazonSource(source: SourceEntry, editionId: string): Prisma.AmazonBookCreateInput {
  const data = source.data as SearchProviderResult

  if (!data.asin) {
    throw new Error('mapAmazonSource: missing asin')
  }

  return {
    asin: data.asin,
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
    publisher: data.publisher || null,
  }
}

/**
 * Create or update provider records for an edition based on verified sources
 */
async function upsertProviderRecords(
  editionId: string,
  sources: SourceEntry[]
): Promise<{
  hardcover: 'created' | 'updated' | 'unchanged' | null
  ibdb: 'created' | 'updated' | 'unchanged' | null
  amazon: 'created' | 'updated' | 'unchanged' | null
}> {
  const result: {
    hardcover: 'created' | 'updated' | 'unchanged' | null
    ibdb: 'created' | 'updated' | 'unchanged' | null
    amazon: 'created' | 'updated' | 'unchanged' | null
  } = {
    hardcover: null,
    ibdb: null,
    amazon: null,
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

    if (source.provider === 'amazon') {
      const amazonData = source.data as SearchProviderResult
      if (!amazonData.asin) {
        console.error('Skipping AmazonBook upsert: source has no asin')
        continue
      }
      try {
        const data = mapAmazonSource(source, editionId)

        const existing = await prisma.amazonBook.findUnique({
          where: { editionId }
        })

        if (existing) {
          await prisma.amazonBook.update({
            where: { editionId },
            data: {
              asin: data.asin,
              title: data.title,
              authors: data.authors,
              description: data.description,
              publishedDate: data.publishedDate,
              pageCount: data.pageCount,
              imageUrl: data.imageUrl,
              categories: data.categories,
              isbn10: data.isbn10,
              isbn13: data.isbn13,
              publisher: data.publisher,
            }
          })
          result.amazon = 'updated'
        } else {
          await prisma.amazonBook.create({ data })
          result.amazon = 'created'
        }
      } catch (error) {
        console.error('Failed to upsert AmazonBook:', error)
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
): Promise<{
  hardcover: 'created' | 'updated' | 'unchanged' | null
  ibdb: 'created' | 'updated' | 'unchanged' | null
  amazon: 'created' | 'updated' | 'unchanged' | null
}> {
  // Check if sources array exists
  if (!signedResult.sources || signedResult.sources.length === 0) {
    console.warn('No sources array in signed result, skipping multi-provider save')
    return { hardcover: null, ibdb: null, amazon: null }
  }

  // Check if signature is present
  if (!signedResult.signature) {
    console.warn('Unverified sources array (no signature), skipping multi-provider save')
    return { hardcover: null, ibdb: null, amazon: null }
  }

  // Verify signature
  if (!verifySignature(signedResult)) {
    console.warn('Signature verification failed, skipping multi-provider save')
    return { hardcover: null, ibdb: null, amazon: null }
  }

  // Signature verified, upsert provider records
  return await upsertProviderRecords(editionId, signedResult.sources)
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
    ibdb: null,
    amazon: null,
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
      } else if (source.provider === 'amazon') {
        const amazonSourceData = source.data as SearchProviderResult
        if (!amazonSourceData.asin) {
          console.error('Skipping AmazonBook upsert: source has no asin')
          continue
        }
        const existing = await prisma.amazonBook.findUnique({
          where: { editionId }
        })

        if (existing) {
          const data = mapAmazonSource(source, editionId)
          await prisma.amazonBook.update({
            where: { editionId },
            data: {
              asin: data.asin,
              title: data.title,
              authors: data.authors,
              description: data.description,
              publishedDate: data.publishedDate,
              pageCount: data.pageCount,
              imageUrl: data.imageUrl,
              categories: data.categories,
              isbn10: data.isbn10,
              isbn13: data.isbn13,
              publisher: data.publisher,
            }
          })
          result.amazon = 'updated'
        } else {
          await prisma.amazonBook.create({
            data: mapAmazonSource(source, editionId)
          })
          result.amazon = 'created'
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
