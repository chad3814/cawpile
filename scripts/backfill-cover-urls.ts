/**
 * Data Migration Script: Backfill Cover URLs for Existing Editions
 *
 * This script identifies editions that lack cover images across all provider tables
 * and attempts to fetch covers from the Hardcover API by ISBN.
 *
 * Run with: npx ts-node scripts/backfill-cover-urls.ts
 * Or with: npx tsx scripts/backfill-cover-urls.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Hardcover API configuration
const HARDCOVER_ENDPOINT = 'https://api.hardcover.app/v1/graphql'
const HARDCOVER_TOKEN = process.env.HARDCOVER_TOKEN

// Rate limiting configuration
const BATCH_SIZE = 10
const DELAY_BETWEEN_BATCHES_MS = 1000

interface HardcoverDocument {
  id?: string
  title?: string
  image?: {
    url?: string
  }
  isbns?: string[]
}

interface HardcoverHit {
  document: HardcoverDocument
}

interface HardcoverSearchResults {
  hits?: HardcoverHit[]
  found?: number
}

interface HardcoverSearchResponse {
  data?: {
    search?: {
      results?: string | HardcoverSearchResults
      error?: string
    }
  }
  errors?: Array<{ message: string }>
}

/**
 * Search Hardcover API by ISBN
 */
async function searchHardcoverByIsbn(isbn: string): Promise<string | null> {
  if (!HARDCOVER_TOKEN) {
    console.error('HARDCOVER_TOKEN not configured')
    return null
  }

  try {
    const graphqlQuery = `
      query SearchBooks($query: String!) {
        search(query: $query) {
          results
          error
        }
      }
    `

    const response = await fetch(HARDCOVER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HARDCOVER_TOKEN}`
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { query: isbn }
      })
    })

    if (!response.ok) {
      console.error(`Hardcover API error: ${response.status}`)
      return null
    }

    const data: HardcoverSearchResponse = await response.json()

    if (data.errors && data.errors.length > 0) {
      console.error('Hardcover GraphQL errors:', data.errors)
      return null
    }

    if (data.data?.search?.error) {
      console.error('Hardcover search error:', data.data.search.error)
      return null
    }

    if (data.data?.search?.results) {
      const results = data.data.search.results
      const parsed: HardcoverSearchResults = typeof results === 'string'
        ? JSON.parse(results)
        : results

      if (parsed.hits && Array.isArray(parsed.hits) && parsed.hits.length > 0) {
        // Return the first result's image URL
        const imageUrl = parsed.hits[0]?.document?.image?.url
        return imageUrl || null
      }
    }

    return null
  } catch (error) {
    console.error(`Error searching Hardcover for ISBN ${isbn}:`, error)
    return null
  }
}

/**
 * Find editions that are missing cover images
 */
async function findEditionsMissingCovers() {
  // Find editions where all three provider tables either don't exist or have null imageUrl
  const editions = await prisma.edition.findMany({
    where: {
      AND: [
        // Has at least one ISBN for lookup
        {
          OR: [
            { isbn13: { not: null } },
            { isbn10: { not: null } }
          ]
        },
        // Missing cover from all providers
        {
          OR: [
            { googleBook: null },
            { googleBook: { imageUrl: null } }
          ]
        },
        {
          OR: [
            { hardcoverBook: null },
            { hardcoverBook: { imageUrl: null } }
          ]
        },
        {
          OR: [
            { ibdbBook: null },
            { ibdbBook: { imageUrl: null } }
          ]
        }
      ]
    },
    select: {
      id: true,
      title: true,
      isbn13: true,
      isbn10: true,
      hardcoverBook: {
        select: { id: true, imageUrl: true }
      },
      googleBook: {
        select: { imageUrl: true }
      },
      ibdbBook: {
        select: { imageUrl: true }
      }
    }
  })

  return editions
}

/**
 * Update or create HardcoverBook record with the cover image
 */
async function upsertHardcoverCover(editionId: string, imageUrl: string, isbn: string) {
  const existing = await prisma.hardcoverBook.findUnique({
    where: { editionId }
  })

  if (existing) {
    // Update existing record
    await prisma.hardcoverBook.update({
      where: { editionId },
      data: { imageUrl }
    })
    return 'updated'
  } else {
    // Create new record
    await prisma.hardcoverBook.create({
      data: {
        hardcoverId: `backfill-${isbn}-${Date.now()}`,
        edition: { connect: { id: editionId } },
        title: 'Backfilled from Cover Migration',
        authors: [],
        imageUrl,
        categories: []
      }
    })
    return 'created'
  }
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Main migration function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('Backfill Cover URLs Migration')
  console.log('='.repeat(60))

  if (!HARDCOVER_TOKEN) {
    console.error('ERROR: HARDCOVER_TOKEN environment variable is not set')
    process.exit(1)
  }

  console.log('\nFinding editions missing cover images...')
  const editions = await findEditionsMissingCovers()
  console.log(`Found ${editions.length} editions potentially missing covers`)

  if (editions.length === 0) {
    console.log('No editions need cover backfilling. Migration complete.')
    return
  }

  const results = {
    enriched: 0,
    failed: [] as { isbn: string; title: string | null }[],
    skipped: 0
  }

  // Process in batches
  for (let i = 0; i < editions.length; i += BATCH_SIZE) {
    const batch = editions.slice(i, i + BATCH_SIZE)
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(editions.length / BATCH_SIZE)}...`)

    for (const edition of batch) {
      // Prefer ISBN-13, fall back to ISBN-10
      const isbn = edition.isbn13 || edition.isbn10

      if (!isbn) {
        results.skipped++
        continue
      }

      console.log(`  Processing: ${edition.title || 'Unknown'} (ISBN: ${isbn})`)

      const imageUrl = await searchHardcoverByIsbn(isbn)

      if (imageUrl) {
        try {
          const action = await upsertHardcoverCover(edition.id, imageUrl, isbn)
          console.log(`    [SUCCESS] Cover ${action}: ${imageUrl.substring(0, 50)}...`)
          results.enriched++
        } catch (error) {
          console.error(`    [ERROR] Failed to save cover:`, error)
          results.failed.push({ isbn, title: edition.title })
        }
      } else {
        console.log(`    [NOT FOUND] No cover found on Hardcover`)
        results.failed.push({ isbn, title: edition.title })
      }
    }

    // Rate limiting between batches
    if (i + BATCH_SIZE < editions.length) {
      console.log(`  Waiting ${DELAY_BETWEEN_BATCHES_MS}ms before next batch...`)
      await sleep(DELAY_BETWEEN_BATCHES_MS)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('Migration Summary')
  console.log('='.repeat(60))
  console.log(`Total editions processed: ${editions.length}`)
  console.log(`Successfully enriched: ${results.enriched}`)
  console.log(`Failed/not found: ${results.failed.length}`)
  console.log(`Skipped (no ISBN): ${results.skipped}`)

  if (results.failed.length > 0) {
    console.log('\nEditions that could not be enriched:')
    for (const failed of results.failed) {
      console.log(`  - ${failed.title || 'Unknown Title'} (ISBN: ${failed.isbn})`)
    }
  }

  console.log('\nMigration complete.')
}

main()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
