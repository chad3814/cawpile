import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/audit/logger'
import { SearchOrchestrator } from '@/lib/search/SearchOrchestrator'
import { LocalDatabaseProvider } from '@/lib/search/providers/LocalDatabaseProvider'
import { GoogleBooksProvider } from '@/lib/search/providers/GoogleBooksProvider'
import { IbdbProvider } from '@/lib/search/providers/IbdbProvider'
import { HardcoverProvider } from '@/lib/search/providers/HardcoverProvider'
import { signResults, verifySignature } from '@/lib/search/utils/signResult'
import { upsertProviderRecords } from '@/lib/db/books'
import type { SourceEntry } from '@/lib/search/types'

interface ResyncResult {
  editionId: string
  title: string
  summary: {
    hardcover: 'created' | 'updated' | 'unchanged' | 'not_found' | null
    ibdb: 'created' | 'updated' | 'unchanged' | 'not_found' | null
  }
  providerFieldCounts: {
    hardcover: { before: number; after: number }
    ibdb: { before: number; after: number }
  }
  errors: string[]
}

/**
 * Count non-null fields in an object for comparison
 */
function countNonNullFields(obj: Record<string, unknown> | null): number {
  if (!obj) return 0
  return Object.values(obj).filter(v => v !== null && v !== undefined).length
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Suppress unused variable warning - request is required by Next.js API route signature
  void request

  try {
    const { id: editionId } = await params
    const user = await getCurrentUser()

    // Check admin authentication
    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Fetch existing edition with all provider relations
    const existingEdition = await prisma.edition.findUnique({
      where: { id: editionId },
      include: {
        book: true,
        googleBook: true,
        hardcoverBook: true,
        ibdbBook: true
      }
    })

    if (!existingEdition) {
      return NextResponse.json(
        { error: 'Edition not found' },
        { status: 404 }
      )
    }

    // Capture before state for audit logging
    const beforeState = {
      hardcoverBook: existingEdition.hardcoverBook
        ? { ...existingEdition.hardcoverBook }
        : null,
      ibdbBook: existingEdition.ibdbBook
        ? { ...existingEdition.ibdbBook }
        : null
    }

    // Extract book title and primary author for search
    const title = existingEdition.book.title
    const primaryAuthor = existingEdition.book.authors[0] || ''
    const searchQuery = `${title} ${primaryAuthor}`.trim()

    // Create and configure the search orchestrator
    const orchestrator = new SearchOrchestrator()
    orchestrator.registerProvider(new LocalDatabaseProvider())  // weight: 10
    orchestrator.registerProvider(new HardcoverProvider())      // weight: 6
    orchestrator.registerProvider(new GoogleBooksProvider())    // weight: 5
    orchestrator.registerProvider(new IbdbProvider())           // weight: 4

    // Search for the book
    const searchResults = await orchestrator.search(searchQuery, 5)

    if (searchResults.length === 0) {
      return NextResponse.json({
        success: false,
        editionId,
        title,
        message: 'No search results found for this book',
        summary: {
          hardcover: 'not_found',
          ibdb: 'not_found'
        },
        errors: ['No search results found']
      })
    }

    // Find the best matching result - look for ISBN or title match
    let bestMatch = searchResults[0]
    for (const result of searchResults) {
      // Check for ISBN match
      if (
        (existingEdition.isbn13 && result.isbn13 === existingEdition.isbn13) ||
        (existingEdition.isbn10 && result.isbn10 === existingEdition.isbn10)
      ) {
        bestMatch = result
        break
      }
      // Check for exact title match
      if (result.title.toLowerCase() === title.toLowerCase()) {
        bestMatch = result
      }
    }

    // The search results should include sources from the merged result
    const resultWithSources = bestMatch as typeof bestMatch & { sources?: SourceEntry[] }

    // If no sources array, we can't proceed with multi-provider sync
    if (!resultWithSources.sources || resultWithSources.sources.length === 0) {
      return NextResponse.json({
        success: false,
        editionId,
        title,
        message: 'Search result does not include multi-provider data',
        summary: {
          hardcover: 'not_found',
          ibdb: 'not_found'
        },
        errors: ['No multi-provider data in search results']
      })
    }

    // Sign the result
    const signedResults = signResults([resultWithSources as typeof bestMatch & { sources: SourceEntry[] }])
    const signedResult = signedResults[0]

    // Verify the signature
    if (!signedResult.signature || !verifySignature(signedResult)) {
      return NextResponse.json({
        success: false,
        editionId,
        title,
        message: 'Failed to verify signed search result',
        summary: {
          hardcover: null,
          ibdb: null
        },
        errors: ['Signature verification failed']
      })
    }

    // Upsert provider records
    const upsertResult = await upsertProviderRecords(editionId, signedResult.sources)

    // Fetch updated edition with provider relations
    const updatedEdition = await prisma.edition.findUnique({
      where: { id: editionId },
      include: {
        hardcoverBook: true,
        ibdbBook: true
      }
    })

    // Capture after state for audit logging
    const afterState = {
      hardcoverBook: updatedEdition?.hardcoverBook
        ? { ...updatedEdition.hardcoverBook }
        : null,
      ibdbBook: updatedEdition?.ibdbBook
        ? { ...updatedEdition.ibdbBook }
        : null
    }

    // Calculate field counts
    const providerFieldCounts = {
      hardcover: {
        before: countNonNullFields(beforeState.hardcoverBook as Record<string, unknown>),
        after: countNonNullFields(afterState.hardcoverBook as Record<string, unknown>)
      },
      ibdb: {
        before: countNonNullFields(beforeState.ibdbBook as Record<string, unknown>),
        after: countNonNullFields(afterState.ibdbBook as Record<string, unknown>)
      }
    }

    // Log the resync action to audit log
    await logAdminAction(user.id, {
      entityType: 'Edition',
      entityId: editionId,
      actionType: 'RESYNC',
      fieldName: 'providers',
      oldValue: beforeState,
      newValue: afterState
    })

    const result: ResyncResult = {
      editionId,
      title,
      summary: {
        hardcover: upsertResult.hardcover || (afterState.hardcoverBook ? 'unchanged' : 'not_found'),
        ibdb: upsertResult.ibdb || (afterState.ibdbBook ? 'unchanged' : 'not_found')
      },
      providerFieldCounts,
      errors: []
    }

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error resyncing book:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resync book',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
