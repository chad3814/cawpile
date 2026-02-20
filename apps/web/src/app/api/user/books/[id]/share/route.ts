import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { nanoid } from 'nanoid'

// GET - Check if share exists for this book
export async function GET(
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

    // Check if SharedReview exists for this userBookId
    const existingShare = await prisma.sharedReview.findUnique({
      where: {
        userBookId: id
      }
    })

    if (!existingShare) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Verify user ownership
    if (existingShare.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json(existingShare)
  } catch (error) {
    console.error('Error fetching share:', error)
    return NextResponse.json(
      { error: 'Failed to fetch share' },
      { status: 500 }
    )
  }
}

// POST - Create a new share
export async function POST(
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
    const body = await request.json();

    const { showDates, showBookClubs, showReadathons, showReview } = body

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

    // Validate book status is COMPLETED
    if (userBook.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Only completed books can be shared' },
        { status: 400 }
      )
    }

    // Validate CawpileRating exists
    if (!userBook.cawpileRating) {
      return NextResponse.json(
        { error: 'Book must have a CAWPILE rating to be shared' },
        { status: 400 }
      )
    }

    // Check if share already exists
    const existingShare = await prisma.sharedReview.findUnique({
      where: {
        userBookId: id
      }
    })

    if (existingShare) {
      // Return existing share URL
      const shareUrl = `${process.env.NEXTAUTH_URL}/share/reviews/${existingShare.shareToken}`
      return NextResponse.json({
        shareUrl,
        shareToken: existingShare.shareToken,
        sharedReview: existingShare
      })
    }

    // Generate unique shareToken
    const shareToken = nanoid(21)

    // Create SharedReview record
    const sharedReview = await prisma.sharedReview.create({
      data: {
        userId: user.id,
        userBookId: id,
        shareToken,
        showDates: showDates ?? true,
        showBookClubs: showBookClubs ?? true,
        showReadathons: showReadathons ?? true,
        showReview: showReview ?? true,
      }
    })

    const shareUrl = `${process.env.NEXTAUTH_URL}/share/reviews/${shareToken}`

    return NextResponse.json({
      shareUrl,
      shareToken,
      sharedReview
    })
  } catch (error) {
    console.error('Error creating share:', error)
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    )
  }
}

// PATCH - Update privacy settings
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

    const { showDates, showBookClubs, showReadathons, showReview } = body

    // Validate at least one field is provided
    if (showDates === undefined && showBookClubs === undefined && showReadathons === undefined && showReview === undefined) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Check if SharedReview exists for this userBookId
    const existingShare = await prisma.sharedReview.findUnique({
      where: {
        userBookId: id
      },
      include: {
        userBook: true
      }
    })

    if (!existingShare) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Verify user ownership
    if (existingShare.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: {
      showDates?: boolean
      showBookClubs?: boolean
      showReadathons?: boolean
      showReview?: boolean
    } = {}

    if (showDates !== undefined) updateData.showDates = showDates
    if (showBookClubs !== undefined) updateData.showBookClubs = showBookClubs
    if (showReadathons !== undefined) updateData.showReadathons = showReadathons
    if (showReview !== undefined) updateData.showReview = showReview

    // Update SharedReview
    const updatedShare = await prisma.sharedReview.update({
      where: {
        userBookId: id
      },
      data: updateData
    })
    const shareToken = updatedShare.shareToken;
    const shareUrl = `${process.env.NEXTAUTH_URL}/share/reviews/${shareToken}`

    return NextResponse.json({ shareUrl, shareToken, sharedReview: updatedShare })
  } catch (error) {
    console.error('Error updating share:', error)
    return NextResponse.json(
      { error: 'Failed to update share' },
      { status: 500 }
    )
  }
}

// DELETE - Remove share
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

    // Check if SharedReview exists for this userBookId
    const existingShare = await prisma.sharedReview.findUnique({
      where: {
        userBookId: id
      }
    })

    if (!existingShare) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Verify user ownership
    if (existingShare.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete SharedReview
    await prisma.sharedReview.delete({
      where: {
        userBookId: id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting share:', error)
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    )
  }
}
