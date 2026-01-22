/**
 * Bulk resync script to repopulate GoogleBook and IBDB records
 *
 * This script:
 * 1. Finds all editions missing GoogleBook records (that have googleBooksId)
 * 2. Fetches fresh data from Google Books API
 * 3. Creates the GoogleBook records
 * 4. Uses the search orchestrator to find and create IBDB records
 *
 * Usage: npx tsx scripts/bulk-resync.ts
 */

import { PrismaClient } from '@prisma/client'
import { getBookById } from '../src/lib/googleBooks'
import { IbdbProvider } from '../src/lib/search/providers/IbdbProvider'

const prisma = new PrismaClient()

interface ResyncStats {
  googleBook: {
    attempted: number
    created: number
    failed: number
    skipped: number
  }
  ibdb: {
    attempted: number
    created: number
    failed: number
    skipped: number
  }
}

async function resyncGoogleBooks(): Promise<ResyncStats['googleBook']> {
  const stats = { attempted: 0, created: 0, failed: 0, skipped: 0 }

  // Find editions with googleBooksId but no GoogleBook record
  const editionsMissingGoogle = await prisma.edition.findMany({
    where: {
      googleBooksId: { not: null },
      googleBook: null
    },
    include: {
      book: true
    }
  })

  console.log(`\nFound ${editionsMissingGoogle.length} editions missing GoogleBook records`)

  for (const edition of editionsMissingGoogle) {
    stats.attempted++

    if (!edition.googleBooksId) {
      stats.skipped++
      continue
    }

    console.log(`  Fetching: ${edition.book.title} (${edition.googleBooksId})`)

    try {
      const bookData = await getBookById(edition.googleBooksId)

      if (!bookData) {
        console.log(`    ❌ Not found in Google Books API`)
        stats.failed++
        continue
      }

      await prisma.googleBook.create({
        data: {
          googleId: bookData.googleId || edition.googleBooksId,
          editionId: edition.id,
          title: bookData.title,
          subtitle: bookData.subtitle || null,
          authors: bookData.authors || [],
          description: bookData.description || null,
          publishedDate: bookData.publishedDate || null,
          pageCount: bookData.pageCount || null,
          imageUrl: bookData.imageUrl || null,
          categories: bookData.categories || []
        }
      })

      console.log(`    ✅ Created GoogleBook record`)
      stats.created++

      // Rate limit to avoid API throttling
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.log(`    ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`)
      stats.failed++
    }
  }

  return stats
}

/**
 * Normalize authors from IBDB response - can be strings or objects with 'name' property
 */
function normalizeAuthors(authors: unknown): string[] {
  if (!authors || !Array.isArray(authors)) return []

  return authors.map(author => {
    if (typeof author === 'string') return author
    if (author && typeof author === 'object' && 'name' in author) {
      return String((author as { name: unknown }).name)
    }
    return String(author)
  }).filter(Boolean)
}

/**
 * Normalize categories from IBDB response - can be strings or objects
 */
function normalizeCategories(categories: unknown): string[] {
  if (!categories || !Array.isArray(categories)) return []

  return categories.map(cat => {
    if (typeof cat === 'string') return cat
    if (cat && typeof cat === 'object' && 'name' in cat) {
      return String((cat as { name: unknown }).name)
    }
    return String(cat)
  }).filter(Boolean)
}

async function resyncIbdbBooks(): Promise<ResyncStats['ibdb']> {
  const stats = { attempted: 0, created: 0, failed: 0, skipped: 0 }

  // Find editions with ISBNs but no IbdbBook record
  const editionsMissingIbdb = await prisma.edition.findMany({
    where: {
      OR: [
        { isbn10: { not: null } },
        { isbn13: { not: null } }
      ],
      ibdbBook: null
    },
    include: {
      book: true
    }
  })

  console.log(`\nFound ${editionsMissingIbdb.length} editions missing IbdbBook records`)

  const ibdbProvider = new IbdbProvider()

  for (const edition of editionsMissingIbdb) {
    stats.attempted++

    const isbn = edition.isbn13 || edition.isbn10
    if (!isbn) {
      stats.skipped++
      continue
    }

    console.log(`  Searching IBDB: ${edition.book.title} (ISBN: ${isbn})`)

    try {
      const results = await ibdbProvider.search(isbn)

      if (results.length === 0) {
        console.log(`    ⚠️ No IBDB results found`)
        stats.skipped++
        continue
      }

      // Find the best match by ISBN
      const match = results.find(r =>
        r.isbn13 === edition.isbn13 || r.isbn10 === edition.isbn10
      ) || results[0]

      // Normalize authors and categories (IBDB can return objects instead of strings)
      const normalizedAuthors = normalizeAuthors(match.authors)
      const normalizedCategories = normalizeCategories(match.categories)

      await prisma.ibdbBook.create({
        data: {
          ibdbId: match.id || `ibdb-${Date.now()}`,
          editionId: edition.id,
          title: match.title || 'Unknown Title',
          authors: normalizedAuthors,
          description: match.description || null,
          publishedDate: match.publishedDate || null,
          pageCount: match.pageCount || null,
          imageUrl: match.imageUrl || null,
          categories: normalizedCategories,
          isbn10: match.isbn10 || null,
          isbn13: match.isbn13 || null
        }
      })

      console.log(`    ✅ Created IbdbBook record`)
      stats.created++

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 300))
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        console.log(`    ⚠️ Already exists (race condition)`)
        stats.skipped++
      } else {
        console.log(`    ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`)
        stats.failed++
      }
    }
  }

  return stats
}

async function main() {
  console.log('=== Bulk Resync Script ===')
  console.log('Repopulating missing GoogleBook and IbdbBook records\n')

  // Get current counts
  const beforeCounts = {
    googleBook: await prisma.googleBook.count(),
    ibdbBook: await prisma.ibdbBook.count(),
    edition: await prisma.edition.count()
  }

  console.log('Before resync:')
  console.log(`  GoogleBook: ${beforeCounts.googleBook}`)
  console.log(`  IbdbBook: ${beforeCounts.ibdbBook}`)
  console.log(`  Edition: ${beforeCounts.edition}`)

  // Resync GoogleBooks
  console.log('\n--- Resyncing Google Books ---')
  const googleStats = await resyncGoogleBooks()

  // Resync IBDB
  console.log('\n--- Resyncing IBDB ---')
  const ibdbStats = await resyncIbdbBooks()

  // Get final counts
  const afterCounts = {
    googleBook: await prisma.googleBook.count(),
    ibdbBook: await prisma.ibdbBook.count()
  }

  console.log('\n=== Summary ===')
  console.log('\nGoogleBook:')
  console.log(`  Before: ${beforeCounts.googleBook} → After: ${afterCounts.googleBook}`)
  console.log(`  Attempted: ${googleStats.attempted}, Created: ${googleStats.created}, Failed: ${googleStats.failed}, Skipped: ${googleStats.skipped}`)

  console.log('\nIbdbBook:')
  console.log(`  Before: ${beforeCounts.ibdbBook} → After: ${afterCounts.ibdbBook}`)
  console.log(`  Attempted: ${ibdbStats.attempted}, Created: ${ibdbStats.created}, Failed: ${ibdbStats.failed}, Skipped: ${ibdbStats.skipped}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
