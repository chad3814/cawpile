import { getCurrentUser } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import DashboardClient from "@/components/dashboard/DashboardClient"
import type { LibrarySortBy, LibrarySortOrder } from "@prisma/client"

// Helper to build orderBy based on user preferences
function buildOrderBy(sortBy: LibrarySortBy, sortOrder: LibrarySortOrder) {
  const order = sortOrder.toLowerCase() as 'asc' | 'desc'
  const nullsPosition = sortOrder === 'DESC' ? 'first' : 'last'

  // Primary sort is always by status
  const statusOrder = { status: 'asc' as const }

  // Secondary sort based on user preference
  let secondaryOrder: Record<string, unknown>

  switch (sortBy) {
    case 'END_DATE':
      secondaryOrder = { finishDate: { sort: order, nulls: nullsPosition } }
      break
    case 'START_DATE':
      secondaryOrder = { startDate: { sort: order, nulls: nullsPosition } }
      break
    case 'TITLE':
      // Title sort needs to go through the relation
      secondaryOrder = { edition: { book: { title: order } } }
      break
    case 'DATE_ADDED':
    default:
      secondaryOrder = { createdAt: order }
      break
  }

  return [statusOrder, secondaryOrder]
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user?.id) {
    redirect("/auth/signin")
  }

  // Fetch user's preferences including reading goal and sort preferences
  const userWithPreferences = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      dashboardLayout: true,
      readingGoal: true,
      librarySortBy: true,
      librarySortOrder: true,
    }
  })

  const sortBy = userWithPreferences?.librarySortBy || 'END_DATE'
  const sortOrder = userWithPreferences?.librarySortOrder || 'DESC'

  // Fetch user's books with dynamic sorting
  const userBooks = await prisma.userBook.findMany({
    where: {
      userId: user.id
    },
    include: {
      edition: {
        include: {
          book: true,
          googleBook: true
        }
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
        }
      }
    },
    orderBy: buildOrderBy(sortBy, sortOrder)
  })

  // Get statistics
  const currentYear = new Date().getFullYear()
  const booksThisYear = await prisma.userBook.count({
    where: {
      userId: user.id,
      status: 'COMPLETED',
      finishDate: {
        gte: new Date(`${currentYear}-01-01`),
        lte: new Date(`${currentYear}-12-31`)
      }
    }
  })

  const totalBooks = await prisma.userBook.count({
    where: {
      userId: user.id
    }
  })

  // Use user's reading goal or default to 12
  const readingGoal = userWithPreferences?.readingGoal ?? 12

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardClient
        books={userBooks}
        initialLayout={userWithPreferences?.dashboardLayout || 'GRID'}
        initialSortBy={sortBy}
        initialSortOrder={sortOrder}
        userName={user?.name?.split(" ")[0]}
      />

      {/* Statistics */}
      {userBooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <h3 className="font-semibold text-card-foreground mb-2">Reading Stats</h3>
            <p className="text-3xl font-bold text-primary">{booksThisYear}</p>
            <p className="text-muted-foreground">Books this year</p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <h3 className="font-semibold text-card-foreground mb-2">Reading Goal</h3>
            <p className="text-3xl font-bold text-primary">{booksThisYear}/{readingGoal}</p>
            <p className="text-muted-foreground">Books completed this year</p>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <h3 className="font-semibold text-card-foreground mb-2">Total Library</h3>
            <p className="text-3xl font-bold text-primary">{totalBooks}</p>
            <p className="text-muted-foreground">Books tracked</p>
          </div>
        </div>
      )}
    </div>
  )
}
