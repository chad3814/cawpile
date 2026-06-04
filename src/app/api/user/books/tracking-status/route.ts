import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { findExistingEdition } from '@/lib/db/books'
import { verifySignature } from '@/lib/search/utils/signResult'
import type { SignedBookSearchResult } from '@/lib/search/types'

/**
 * Returns the current user's latest tracking status for a searched book,
 * WITHOUT creating any book/edition/userBook rows. Used by AddBookWizard to
 * detect a re-read and default its isReread toggle.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { signedResult } = body as { signedResult: SignedBookSearchResult }

    if (!signedResult) {
      return NextResponse.json({ error: 'Signed result is required' }, { status: 400 })
    }
    if (!verifySignature(signedResult)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const edition = await findExistingEdition(signedResult)
    if (!edition) {
      return NextResponse.json({ status: null, readNumber: 0 })
    }

    const latest = await prisma.userBook.findFirst({
      where: { userId: user.id, editionId: edition.id },
      orderBy: { readNumber: 'desc' },
      select: { status: true, readNumber: true },
    })

    return NextResponse.json({
      status: latest?.status ?? null,
      readNumber: latest?.readNumber ?? 0,
    })
  } catch (error) {
    console.error('Error checking tracking status:', error)
    return NextResponse.json({ error: 'Failed to check tracking status' }, { status: 500 })
  }
}
