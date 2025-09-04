import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/auth/signin")
  }

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

      {/* Empty State - will be replaced with book grid later */}
      <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg">
        <svg 
          className="w-24 h-24 text-gray-300 mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
          />
        </svg>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Start building your library
        </h2>
        
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Add your first book to get started. Track what you're reading, want to read, or have finished.
        </p>
        
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Add Your First Book
        </button>
      </div>

      {/* Placeholder sections for future features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-2">Reading Stats</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-gray-600">Books this year</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-2">Reading Goal</h3>
          <p className="text-3xl font-bold text-blue-600">0/12</p>
          <p className="text-gray-600">Books completed</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-semibold text-gray-900 mb-2">Total Library</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
          <p className="text-gray-600">Books tracked</p>
        </div>
      </div>
    </div>
  )
}