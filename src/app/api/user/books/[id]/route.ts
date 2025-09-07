import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { calculateCawpileAverage } from '@/types/cawpile'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
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
      review,
      notes,
      isFavorite,
      currentPage,
      startDate,
      finishDate,
      cawpileRating 
    } = body

    // Validate progress if provided
    if (progress !== undefined && (typeof progress !== 'number' || progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: 'Invalid progress value' },
        { status: 400 }
      )
    }

    // Check if user owns this book
    const userBook = await prisma.userBook.findFirst({
      where: {
        id: id,
        userId: session.user.id
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
    if (review !== undefined) updateData.review = review
    if (notes !== undefined) updateData.notes = notes
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite
    if (currentPage !== undefined) updateData.currentPage = currentPage
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (finishDate !== undefined) updateData.finishDate = new Date(finishDate)

    // Handle status changes
    if (status === 'COMPLETED' && !userBook.finishDate && !finishDate) {
      updateData.finishDate = new Date()
    }
    if (status === 'READING' && !userBook.startDate && !startDate) {
      updateData.startDate = new Date()
    }

    // If progress reaches 100%, mark as completed
    if (progress === 100 && userBook.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED'
      if (!userBook.finishDate) {
        updateData.finishDate = new Date()
      }
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