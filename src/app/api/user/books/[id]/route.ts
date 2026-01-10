import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { BookFormat, Prisma } from '@prisma/client'
import { calculateCawpileAverage } from '@/types/cawpile'

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
      authorPocDetails
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
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (finishDate !== undefined) updateData.finishDate = new Date(finishDate)

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

    // Handle status changes
    if (status === 'COMPLETED' && !userBook.finishDate && !finishDate) {
      updateData.finishDate = new Date()
    }
    if (status === 'READING' && !userBook.startDate && !startDate) {
      updateData.startDate = new Date()
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
            googleBook: true
          }
        },
        cawpileRating: true
      }
    })

    // Handle CAWPILE rating separately
    if (cawpileRating) {
      // Allow null values for skipped facets
      const ratingData = {
        characters: cawpileRating.characters !== undefined ? cawpileRating.characters : null,
        atmosphere: cawpileRating.atmosphere !== undefined ? cawpileRating.atmosphere : null,
        writing: cawpileRating.writing !== undefined ? cawpileRating.writing : null,
        plot: cawpileRating.plot !== undefined ? cawpileRating.plot : null,
        intrigue: cawpileRating.intrigue !== undefined ? cawpileRating.intrigue : null,
        logic: cawpileRating.logic !== undefined ? cawpileRating.logic : null,
        enjoyment: cawpileRating.enjoyment !== undefined ? cawpileRating.enjoyment : null
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
            googleBook: true
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
