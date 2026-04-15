import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-helpers'
import prisma from '@/lib/prisma'
import { BookStatus } from '@prisma/client'
import LibrarySectionClient from '@/components/dashboard/LibrarySectionClient'

const SECTION_MAP: Record<string, { status: BookStatus | BookStatus[]; title: string }> = {
  'currently-reading': { status: 'READING', title: 'Currently Reading' },
  'tbr': { status: 'WANT_TO_READ', title: 'To Be Read' },
  'completed': { status: ['COMPLETED', 'DNF'] as BookStatus[], title: 'Completed' },
}

export default async function LibrarySectionPage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  const config = SECTION_MAP[section]

  if (!config) {
    notFound()
  }

  const user = await getCurrentUser()

  if (!user?.id) {
    redirect('/auth/signin')
  }

  const statusFilter = Array.isArray(config.status)
    ? { in: config.status }
    : config.status

  const books = await prisma.userBook.findMany({
    where: {
      userId: user.id,
      status: statusFilter,
    },
    include: {
      edition: {
        include: {
          book: true,
          googleBook: true,
          hardcoverBook: true,
          ibdbBook: true,
        },
      },
      cawpileRating: true,
      sharedReview: {
        select: {
          id: true,
          shareToken: true,
          showDates: true,
          showBookClubs: true,
          showReadathons: true,
          showReview: true,
        },
      },
    },
    orderBy: [
      { isPinned: 'desc' },
      { sortOrder: { sort: 'asc', nulls: 'last' } },
      { updatedAt: 'desc' },
    ],
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <LibrarySectionClient
        books={books}
        title={config.title}
      />
    </div>
  )
}
