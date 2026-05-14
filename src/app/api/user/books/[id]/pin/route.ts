import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'

export async function PATCH(
  _request: NextRequest,
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

    // Single atomic UPDATE — flips isPinned and verifies ownership in one round-trip,
    // eliminating the TOCTOU race that findFirst + update would have.
    const result = await prisma.$queryRaw<{ id: string; isPinned: boolean }[]>`
      UPDATE "UserBook"
      SET "isPinned" = NOT "isPinned"
      WHERE "id" = ${id} AND "userId" = ${user.id}
      RETURNING "id", "isPinned"
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ userBook: result[0] })
  } catch (error) {
    console.error('Error toggling pin:', error)
    return NextResponse.json(
      { error: 'Failed to toggle pin' },
      { status: 500 }
    )
  }
}
