/**
 * Data migration script to backfill cover URLs for editions missing covers.
 *
 * Identifies editions that have no imageUrl in any provider table (GoogleBook, HardcoverBook, IbdbBook)
 * and attempts to fetch covers from the Hardcover API by ISBN.
 *
 * Run with: npx tsx prisma/scripts/backfill-cover-urls.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface HardcoverDocument {
  id?: string
  title?: string
  description?: string
  author_names?: string[]
  release_date?: string
  pages?: number
  image?: {
    url?: string
  }
  isbns?: string[]
  genres?: string[]
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
async function searchHardcoverByIsbn(isbn: string): Promise<HardcoverDocument | null> {
  const token = process.env.HARDCOVER_TOKEN
  if (!token) {
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

    const response = await fetch('https://api.hardcover.app/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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

      if (parsed.hits && parsed.hits.length > 0) {
        return parsed.hits[0].document
      }
    }

    return null
  } catch (error) {
    console.error('Hardcover client error:', error)
    return null
  }
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('Starting cover URL backfill...\n')

  // Find editions missing cover URLs in all provider tables
  const editionsMissingCovers = await prisma.edition.findMany({
    where: {
      AND: [
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
      ],
      // Only process editions with ISBN-13 for API lookup
      isbn13: { not: null }
    },
    select: {
      id: true,
      title: true,
      isbn13: true,
      authors: true,
      book: {
        select: {
          title: true
        }
      },
      hardcoverBook: {
        select: { id: true }
      }
    }
  })

  console.log(`Found ${editionsMissingCovers.length} editions missing cover URLs with valid ISBN-13\n`)

  if (editionsMissingCovers.length === 0) {
    console.log('No editions need cover backfill. Done!')
    return
  }

  let successCount = 0
  let errorCount = 0
  let notFoundCount = 0
  const failedEditions: Array<{ isbn: string; title: string }> = []

  for (const edition of editionsMissingCovers) {
    const displayTitle = edition.title || edition.book?.title || 'Unknown Title'
    const isbn = edition.isbn13!

    try {
      console.log(`Processing: "${displayTitle}" (ISBN: ${isbn})`)

      // Search Hardcover by ISBN
      const hardcoverDoc = await searchHardcoverByIsbn(isbn)

      if (hardcoverDoc && hardcoverDoc.image?.url) {
        // Create or update HardcoverBook record
        if (edition.hardcoverBook) {
          // Update existing record
          await prisma.hardcoverBook.update({
            where: { id: edition.hardcoverBook.id },
            data: { imageUrl: hardcoverDoc.image.url }
          })
        } else {
          // Create new HardcoverBook record
          await prisma.hardcoverBook.create({
            data: {
              hardcoverId: hardcoverDoc.id || `backfill-${isbn}`,
              editionId: edition.id,
              title: hardcoverDoc.title || displayTitle,
              authors: hardcoverDoc.author_names || edition.authors || [],
              description: hardcoverDoc.description,
              releaseDate: hardcoverDoc.release_date,
              pages: hardcoverDoc.pages,
              imageUrl: hardcoverDoc.image.url,
              categories: hardcoverDoc.genres || [],
              isbn13: isbn
            }
          })
        }

        console.log(`  ✅ Cover found and saved`)
        successCount++
      } else {
        console.log(`  ⚠️ No cover found on Hardcover`)
        notFoundCount++
        failedEditions.push({ isbn, title: displayTitle })
      }

      // Rate limit: 200ms between requests
      await delay(200)
    } catch (error) {
      console.error(`  ❌ Error processing:`, error)
      errorCount++
      failedEditions.push({ isbn, title: displayTitle })
    }
  }

  console.log('\n=== Backfill Complete ===')
  console.log(`✅ Successful: ${successCount}`)
  console.log(`⚠️ Not found: ${notFoundCount}`)
  console.log(`❌ Errors: ${errorCount}`)

  if (failedEditions.length > 0) {
    console.log('\n=== Editions that could not be enriched ===')
    for (const edition of failedEditions) {
      console.log(`  - ${edition.title} (ISBN: ${edition.isbn})`)
    }
  }
}

main()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
