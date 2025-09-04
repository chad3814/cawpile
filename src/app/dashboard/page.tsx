import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import BookGrid from "@/components/dashboard/BookGrid"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  // Fetch user's books
  const userBooks = await prisma.userBook.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      edition: {
        include: {
          book: true,
          googleBook: true
        }
      }
    },
    orderBy: [
      {
        status: 'asc'
      },
      {
        createdAt: 'desc'
      }
    ]
  })

  // Get statistics
  const currentYear = new Date().getFullYear()
  const booksThisYear = await prisma.userBook.count({
    where: {
      userId: session.user.id,
      status: 'COMPLETED',
      finishDate: {
        gte: new Date(`${currentYear}-01-01`),
        lte: new Date(`${currentYear}-12-31`)
      }
    }
  })

  const totalBooks = await prisma.userBook.count({
    where: {
      userId: session.user.id
    }
  })

  const completedBooks = await prisma.userBook.count({
    where: {
      userId: session.user.id,
      status: 'COMPLETED'
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user?.name?.split(" ")[0] || "Reader"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Your reading dashboard
        </p>
      </div>

      {/* Book Grid */}
      <BookGrid books={userBooks} />

      {/* Statistics */}
      {userBooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">Reading Stats</h3>
            <p className="text-3xl font-bold text-blue-600">{booksThisYear}</p>
            <p className="text-gray-600">Books this year</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">Reading Goal</h3>
            <p className="text-3xl font-bold text-blue-600">{completedBooks}/12</p>
            <p className="text-gray-600">Books completed</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">Total Library</h3>
            <p className="text-3xl font-bold text-blue-600">{totalBooks}</p>
            <p className="text-gray-600">Books tracked</p>
          </div>
        </div>
      )}
    </div>
  )
}