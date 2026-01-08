import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Fetch public review data (NO authentication required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await params

    // Query SharedReview by shareToken with all necessary includes
    const sharedReview = await prisma.sharedReview.findUnique({
      where: {
        shareToken
      },
      include: {
        userBook: {
          include: {
            edition: {
              include: {
                book: true,
                googleBook: true
              }
            },
            cawpileRating: true
          }
        }
      }
    })

    if (!sharedReview) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Build response with only whitelisted fields
    const responseData = {
      // Book metadata
      book: {
        title: sharedReview.userBook.edition.book.title,
        authors: sharedReview.userBook.edition.book.authors
      },
      // Edition data
      edition: {
        isbn10: sharedReview.userBook.edition.isbn10,
        isbn13: sharedReview.userBook.edition.isbn13
      },
      // Google Book data (if available)
      googleBook: sharedReview.userBook.edition.googleBook ? {
        imageUrl: sharedReview.userBook.edition.googleBook.imageUrl,
        description: sharedReview.userBook.edition.googleBook.description,
        publishedDate: sharedReview.userBook.edition.googleBook.publishedDate,
        pageCount: sharedReview.userBook.edition.googleBook.pageCount,
        publisher: sharedReview.userBook.edition.googleBook.publisher
      } : null,
      // CAWPILE rating (all facets + computed scores)
      cawpileRating: sharedReview.userBook.cawpileRating ? {
        characters: sharedReview.userBook.cawpileRating.characters,
        atmosphere: sharedReview.userBook.cawpileRating.atmosphere,
        writing: sharedReview.userBook.cawpileRating.writing,
        plot: sharedReview.userBook.cawpileRating.plot,
        intrigue: sharedReview.userBook.cawpileRating.intrigue,
        logic: sharedReview.userBook.cawpileRating.logic,
        enjoyment: sharedReview.userBook.cawpileRating.enjoyment,
        average: sharedReview.userBook.cawpileRating.average
      } : null,
      // Review text
      review: sharedReview.userBook.review,
      // Book format
      format: sharedReview.userBook.format,
      // Conditional fields based on privacy settings
      ...(sharedReview.showDates && {
        startDate: sharedReview.userBook.startDate,
        finishDate: sharedReview.userBook.finishDate
      }),
      ...(sharedReview.showBookClubs && sharedReview.userBook.bookClubName && {
        bookClubName: sharedReview.userBook.bookClubName
      }),
      ...(sharedReview.showReadathons && sharedReview.userBook.readathonName && {
        readathonName: sharedReview.userBook.readathonName
      })
    }

    // Set cache headers for public endpoint
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Error fetching shared review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shared review' },
      { status: 500 }
    )
  }
}
