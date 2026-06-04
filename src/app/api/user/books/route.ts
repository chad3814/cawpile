import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { findOrCreateBook, findOrCreateEditionFromSignedResult } from '@/lib/db/books'
import { resolveTrackingAction } from '@/lib/db/resolveTrackingAction'
import { recomputeBookStats } from '@/lib/db/bookStats'
import prisma from '@/lib/prisma'
import { BookStatus, BookFormat, Prisma } from '@prisma/client'
import type { SignedBookSearchResult } from '@/lib/search/types'
import { verifySignature } from '@/lib/search/utils/signResult'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const {
      signedResult,
      editionId,
      status,
      format,
      startDate,
      finishDate,
      progress,
      // New tracking fields
      acquisitionMethod,
      acquisitionOther,
      bookClubName,
      readathonName,
      isReread,
      dnfReason
    } = body as {
      signedResult?: SignedBookSearchResult
      editionId?: string
      status: BookStatus
      format: BookFormat[]
      startDate?: string
      finishDate?: string
      progress?: number
      acquisitionMethod?: string
      acquisitionOther?: string
      bookClubName?: string
      readathonName?: string
      isReread?: boolean
      dnfReason?: string
    }

    // Require exactly one source: an internal editionId (public page) or a
    // signed search result (search-driven add flow).
    if (!signedResult && !editionId) {
      return NextResponse.json(
        { error: 'Either editionId or signedResult is required' },
        { status: 400 }
      )
    }

    if (editionId && signedResult) {
      return NextResponse.json(
        { error: 'Provide either editionId or signedResult, not both' },
        { status: 400 }
      )
    }

    // Validate format array
    if (!format || !Array.isArray(format) || format.length === 0) {
      return NextResponse.json(
        { error: 'At least one format is required' },
        { status: 400 }
      )
    }

    // Validate each format is a valid BookFormat enum value
    const validFormats = Object.values(BookFormat)
    for (const f of format) {
      if (!validFormats.includes(f)) {
        return NextResponse.json(
          { error: `Invalid format: ${f}` },
          { status: 400 }
        )
      }
    }

    // Remove duplicates from format array
    const uniqueFormats = Array.from(new Set(format))

    // Resolve the edition: look up an existing one by id, or verify + create
    // from the signed search result.
    let edition: { id: string; bookId: string }

    if (editionId) {
      const existingEdition = await prisma.edition.findUnique({
        where: { id: editionId },
        select: { id: true, bookId: true },
      })
      if (!existingEdition) {
        return NextResponse.json(
          { error: 'Edition not found' },
          { status: 404 }
        )
      }
      edition = existingEdition
    } else {
      const result = signedResult as SignedBookSearchResult
      if (!verifySignature(result)) {
        return NextResponse.json(
          { error: 'Invalid signature - book data may have been tampered with' },
          { status: 400 }
        )
      }
      const book = await findOrCreateBook(
        result.title,
        result.authors,
        'en', // Default to English, can be enhanced later
        result.categories // Pass categories for book type detection
      )
      edition = await findOrCreateEditionFromSignedResult(book.id, result)
    }

    const includeEdition = {
      edition: {
        include: { book: true, googleBook: true, hardcoverBook: true, ibdbBook: true, amazonBook: true },
      },
    }

    // Shared tracking fields applied to every write.
    const trackingFields = {
      format: uniqueFormats,
      acquisitionMethod,
      acquisitionOther: acquisitionMethod === 'Other' ? acquisitionOther : null,
      bookClubName,
      readathonName,
      isReread: isReread || false,
    }

    // Record book club / readathon autocomplete usage. Runs only for writes
    // (never a no-op) and exactly once, after the write succeeds.
    const recordAutocomplete = async () => {
      if (bookClubName) {
        await prisma.userBookClub.upsert({
          where: { userId_name: { userId: user.id, name: bookClubName } },
          update: { lastUsed: new Date(), usageCount: { increment: 1 } },
          create: { userId: user.id, name: bookClubName },
        })
      }
      if (readathonName) {
        await prisma.userReadathon.upsert({
          where: { userId_name: { userId: user.id, name: readathonName } },
          update: { lastUsed: new Date(), usageCount: { increment: 1 } },
          create: { userId: user.id, name: readathonName },
        })
      }
    }

    // Resolve the tracking action against the user's latest read and execute it.
    // On a readNumber unique-constraint race (concurrent re-tracks of the same
    // edition), re-read `latest` and re-resolve: a row another request just
    // created may now make this a no-op or in-place update rather than a spurious
    // extra read.
    const MAX_ATTEMPTS = 3
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const latest = await prisma.userBook.findFirst({
        where: { userId: user.id, editionId: edition.id },
        orderBy: { readNumber: 'desc' },
        select: { id: true, status: true, readNumber: true, startDate: true },
      })

      const action = resolveTrackingAction(latest, status)

      // Already in the requested live status: nothing to do, return it unchanged.
      if (action.kind === 'noop') {
        const existing = await prisma.userBook.findUnique({
          where: { id: action.userBookId },
          include: includeEdition,
        })
        // In a no-op, the request status equals the existing record's status.
        const message =
          status === BookStatus.READING ? 'Already in Currently Reading' : 'Already on your TBR'
        return NextResponse.json({ userBook: existing, action: 'noop', message })
      }

      // Live row in a different status: update it in place.
      if (action.kind === 'update') {
        const updateData: Prisma.UserBookUpdateInput = { status, ...trackingFields }
        let message: string
        if (status === BookStatus.READING) {
          // Preserve an existing startDate (e.g. set while on TBR); otherwise default to now.
          updateData.startDate = startDate ? new Date(startDate) : (latest!.startDate ?? new Date())
          message = 'Moved to Currently Reading'
        } else if (status === BookStatus.WANT_TO_READ) {
          updateData.startDate = null // back to TBR; progress/currentPage are kept
          message = 'Moved to Want to Read'
        } else if (status === BookStatus.COMPLETED) {
          if (startDate) updateData.startDate = new Date(startDate)
          updateData.finishDate = finishDate ? new Date(finishDate) : new Date()
          updateData.progress = 100
          message = 'Marked as completed'
        } else {
          // DNF
          if (startDate) updateData.startDate = new Date(startDate)
          updateData.finishDate = finishDate ? new Date(finishDate) : new Date()
          updateData.dnfReason = dnfReason ?? null
          message = 'Marked as did not finish'
        }

        const updated = await prisma.$transaction(async (tx) => {
          const row = await tx.userBook.update({
            where: { id: action.userBookId },
            data: updateData,
            include: includeEdition,
          })
          await recomputeBookStats(edition.bookId, tx)
          return row
        })
        await recordAutocomplete()
        return NextResponse.json({ userBook: updated, action: 'updated', message })
      }

      // create or reread: a fresh row. Compute readNumber inside the transaction
      // (max existing + 1) so it can't go stale. A unique-constraint violation
      // means another request won the race — loop to re-resolve against the now
      // newer `latest` (which may turn this into a no-op or update).
      try {
        const created = await prisma.$transaction(async (tx) => {
          const current = await tx.userBook.findFirst({
            where: { userId: user.id, editionId: edition.id },
            orderBy: { readNumber: 'desc' },
            select: { readNumber: true },
          })
          const readNumber = current ? current.readNumber + 1 : 1
          // Terminal-status defaulting mirrors the in-place update path: a
          // COMPLETED/DNF read defaults finishDate to now when absent, and
          // COMPLETED forces progress to 100.
          const isCompleted = status === BookStatus.COMPLETED
          const isDnf = status === BookStatus.DNF
          const row = await tx.userBook.create({
            data: {
              userId: user.id,
              editionId: edition.id,
              status,
              startDate: startDate ? new Date(startDate) : null,
              finishDate: finishDate
                ? new Date(finishDate)
                : (isCompleted || isDnf ? new Date() : null),
              progress: isCompleted ? 100 : (progress || 0),
              dnfReason: isDnf ? (dnfReason ?? null) : null,
              readNumber,
              ...trackingFields,
            },
            include: includeEdition,
          })
          await recomputeBookStats(edition.bookId, tx)
          return row
        })
        await recordAutocomplete()
        const wasReread = created.readNumber > 1
        return NextResponse.json({
          userBook: created,
          action: wasReread ? 'reread' : 'created',
          message: wasReread ? 'Added as a re-read' : 'Added to your library',
        })
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002' &&
          attempt < MAX_ATTEMPTS - 1
        ) {
          continue
        }
        throw e
      }
    }

    // Exhausted retries under sustained contention.
    return NextResponse.json({ error: 'Failed to add book' }, { status: 409 })
  } catch (error) {
    console.error('Error adding book:', error)
    return NextResponse.json(
      { error: 'Failed to add book' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const where: Prisma.UserBookScalarWhereInput = {
      userId: user.id
    }

    if (status) {
      where.status = status as BookStatus
    }

    const userBooks = await prisma.userBook.findMany({
      where,
      include: {
        edition: {
          include: {
            book: true,
            googleBook: true,
            hardcoverBook: true,
            ibdbBook: true,
            amazonBook: true
          }
        },
        cawpileRating: true
      },
      orderBy: status
        ? [
            { isPinned: 'desc' },
            { sortOrder: { sort: 'asc', nulls: 'last' } },
            { updatedAt: 'desc' },
          ]
        : [
            { status: 'asc' },
            { isPinned: 'desc' },
            { sortOrder: { sort: 'asc', nulls: 'last' } },
            { updatedAt: 'desc' },
          ],
      take: limit ? parseInt(limit, 10) : undefined,
      skip: offset ? parseInt(offset, 10) : undefined
    })

    // Get counts for each status
    const stats = await prisma.userBook.groupBy({
      by: ['status'],
      where: {
        userId: user.id
      },
      _count: true
    })

    const formattedStats = {
      WANT_TO_READ: 0,
      READING: 0,
      COMPLETED: 0
    }

    stats.forEach(stat => {
      formattedStats[stat.status as keyof typeof formattedStats] = stat._count
    })

    return NextResponse.json({
      books: userBooks,
      stats: formattedStats,
      total: userBooks.length
    })
  } catch (error) {
    console.error('Error fetching user books:', error)
    return NextResponse.json(
      { error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}
