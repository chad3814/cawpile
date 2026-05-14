import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const MAX_REORDER_BATCH = 1000

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { bookIds } = body as { bookIds: unknown }

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json(
        { error: 'bookIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (bookIds.length > MAX_REORDER_BATCH) {
      return NextResponse.json(
        { error: `bookIds must contain at most ${MAX_REORDER_BATCH} entries` },
        { status: 400 }
      )
    }

    if (bookIds.some(id => typeof id !== 'string' || id.trim() === '')) {
      return NextResponse.json(
        { error: 'All bookIds must be non-empty strings' },
        { status: 400 }
      )
    }

    const typedBookIds = bookIds as string[]

    // Single UPDATE with CASE — atomic, one round-trip, and the userId predicate
    // enforces ownership in the same statement.
    const updated = await prisma.$executeRaw`
      UPDATE "UserBook"
      SET "sortOrder" = CASE "id"
        ${Prisma.join(
          typedBookIds.map((id, i) => Prisma.sql`WHEN ${id} THEN ${i}`),
          ' '
        )}
      END
      WHERE "id" IN (${Prisma.join(typedBookIds)})
        AND "userId" = ${user.id}
    `

    if (updated !== typedBookIds.length) {
      return NextResponse.json(
        { error: 'One or more books not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering books:', error)
    return NextResponse.json(
      { error: 'Failed to reorder books' },
      { status: 500 }
    )
  }
}
