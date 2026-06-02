import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { BookFormat, Prisma } from '@prisma/client'
import { calculateCawpileAverage } from '@/types/cawpile'
import { validateBookDates, validateStatusDates } from '@/lib/validateBookDates'

// Valid cover provider values
const VALID_COVER_PROVIDERS = ['hardcover', 'google', 'ibdb', 'amazon']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const {
      progress,
      status,
      format,
      review,
      notes,
      isFavorite,
      currentPage,
      startDate,
      finishDate,
      cawpileRating,
      // New tracking fields
      acquisitionMethod,
      acquisitionOther,
      bookClubName,
      readathonName,
      isReread,
      dnfReason,
      lgbtqRepresentation,
      lgbtqDetails,
      disabilityRepresentation,
      disabilityDetails,
      isNewAuthor,
      authorPoc,
      authorPocDetails,
      // Cover preference
      preferredCoverProvider
    } = body

    // Validate format array if provided
    if (format !== undefined) {
      if (!Array.isArray(format) || format.length === 0) {
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
    }

    // Validate progress if provided
    if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: 'Invalid progress value' },
        { status: 400 }
      )
    }

    // Validate review character limit
    if (review !== undefined && typeof review === 'string' && review.length > 5000) {
      return NextResponse.json(
        { error: 'Review must not exceed 5,000 characters' },
        { status: 400 }
      )
    }

    // Validate preferredCoverProvider if provided
    if (preferredCoverProvider !== undefined && preferredCoverProvider !== null) {
      if (!VALID_COVER_PROVIDERS.includes(preferredCoverProvider)) {
        return NextResponse.json(
          { error: `Invalid cover provider: ${preferredCoverProvider}. Must be one of: ${VALID_COVER_PROVIDERS.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Check if user owns this book
    const userBook = await prisma.userBook.findFirst({
      where: {
        id: id,
        userId: user.id
      },
      include: {
        cawpileRating: true
      }
    })

    if (!userBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Validate start/finish dates against each other and the current date.
    // Fall back to the stored value for whichever date is not in this request.
    const toIso = (d: Date | null): string | null => (d ? d.toISOString().split('T')[0] : null)
    const effectiveStart = startDate !== undefined ? startDate : toIso(userBook.startDate)
    const effectiveFinish = finishDate !== undefined ? finishDate : toIso(userBook.finishDate)
    const dateError = validateBookDates({ startDate: effectiveStart, finishDate: effectiveFinish })
    if (dateError) {
      return NextResponse.json({ error: dateError }, { status: 400 })
    }

    // A status that implies a date must keep one: reject an explicit null clear
    // (an absent date is still auto-set below). Use the effective status so the
    // invariant holds even on a partial PATCH that omits status.
    const statusDateError = validateStatusDates(status ?? userBook.status, startDate, finishDate)
    if (statusDateError) {
      return NextResponse.json({ error: statusDateError }, { status: 400 })
    }

    // Prepare update data
    const updateData: Prisma.UserBookUpdateInput = {}

    if (progress !== undefined) updateData.progress = progress
    if (status !== undefined) updateData.status = status

    // Handle format array - remove duplicates
    if (format !== undefined) {
      updateData.format = Array.from(new Set(format))
    }

    if (review !== undefined) updateData.review = review.trim() || null
    if (notes !== undefined) updateData.notes = notes
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite
    if (currentPage !== undefined) updateData.currentPage = currentPage
    if (startDate !== undefined) updateData.startDate = startDate === null ? null : new Date(startDate)
    if (finishDate !== undefined) updateData.finishDate = finishDate === null ? null : new Date(finishDate)

    // New tracking fields
    if (acquisitionMethod !== undefined) updateData.acquisitionMethod = acquisitionMethod
    if (acquisitionOther !== undefined) updateData.acquisitionOther = acquisitionOther
    if (bookClubName !== undefined) updateData.bookClubName = bookClubName
    if (readathonName !== undefined) updateData.readathonName = readathonName
    if (isReread !== undefined) updateData.isReread = isReread
    if (dnfReason !== undefined) updateData.dnfReason = dnfReason
    if (lgbtqRepresentation !== undefined) updateData.lgbtqRepresentation = lgbtqRepresentation
    if (lgbtqDetails !== undefined) updateData.lgbtqDetails = lgbtqDetails
    if (disabilityRepresentation !== undefined) updateData.disabilityRepresentation = disabilityRepresentation
    if (disabilityDetails !== undefined) updateData.disabilityDetails = disabilityDetails
    if (isNewAuthor !== undefined) updateData.isNewAuthor = isNewAuthor
    if (authorPoc !== undefined) updateData.authorPoc = authorPoc
    if (authorPocDetails !== undefined) updateData.authorPocDetails = authorPocDetails

    // Cover preference - allow setting to null to clear preference
    if (preferredCoverProvider !== undefined) {
      updateData.preferredCoverProvider = preferredCoverProvider
    }

    // Handle status changes. Auto-set only when the date is absent from the
    // request (=== undefined); an explicit null was already rejected above for
    // statuses that require the date, so it is never silently overwritten here.
    if (status === 'COMPLETED' && !userBook.finishDate && finishDate === undefined) {
      updateData.finishDate = new Date()
    }
    if (status === 'READING' && !userBook.startDate && startDate === undefined) {
      updateData.startDate = new Date()
    }
    // Auto-set finishDate when status changes to DNF and no finishDate is provided
    if (status === 'DNF' && !userBook.finishDate && finishDate === undefined) {
      updateData.finishDate = new Date()
    }
    // Clear DNF reason if status changes from DNF to something else
    if (status && status !== 'DNF' && userBook.status === 'DNF') {
      updateData.dnfReason = null
    }

    // If progress reaches 100%, mark as completed
    if (progress === 100 && userBook.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED'
      if (!userBook.finishDate) {
        updateData.finishDate = new Date()
      }
    }

    // Update autocomplete tables if book club/readathon names are provided
    if (bookClubName && bookClubName !== userBook.bookClubName) {
      await prisma.userBookClub.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: bookClubName
          }
        },
        update: {
          lastUsed: new Date(),
          usageCount: { increment: 1 }
        },
        create: {
          userId: user.id,
          name: bookClubName
        }
      })
    }

    if (readathonName && readathonName !== userBook.readathonName) {
      await prisma.userReadathon.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: readathonName
          }
        },
        update: {
          lastUsed: new Date(),
          usageCount: { increment: 1 }
        },
        create: {
          userId: user.id,
          name: readathonName
        }
      })
    }

    // Update the main book record
    await prisma.userBook.update({
      where: { id },
      data: updateData,
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
      }
    })

    // Handle CAWPILE rating separately
    if (cawpileRating) {
      // Allow null values for skipped facets
      const ratingData = {
        characters: cawpileRating.characters ?? null,
        atmosphere: cawpileRating.atmosphere ?? null,
        writing: cawpileRating.writing ?? null,
        plot: cawpileRating.plot ?? null,
        intrigue: cawpileRating.intrigue ?? null,
        logic: cawpileRating.logic ?? null,
        enjoyment: cawpileRating.enjoyment ?? null,
      }

      const average = calculateCawpileAverage(ratingData)

      if (userBook.cawpileRating) {
        // Update existing rating
        await prisma.cawpileRating.update({
          where: { id: userBook.cawpileRating.id },
          data: { ...ratingData, average }
        })
      } else {
        // Create new rating
        await prisma.cawpileRating.create({
          data: {
            userBookId: id,
            ...ratingData,
            average
          }
        })
      }
    }

    // Fetch the final updated book with all relations
    const finalBook = await prisma.userBook.findUnique({
      where: { id },
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
      }
    })

    return NextResponse.json({ userBook: finalBook })
  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json(
      { error: 'Failed to update book' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { id } = await params

    // Check if user owns this book
    const userBook = await prisma.userBook.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!userBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Delete the userBook record (this will cascade delete related records)
    await prisma.userBook.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Book removed from library' })
  } catch (error) {
    console.error('Error removing book:', error)
    return NextResponse.json(
      { error: 'Failed to remove book' },
      { status: 500 }
    )
  }
}
