import { requireAdmin } from '@/lib/auth/admin'
import AdminNav from '@/components/admin/AdminNav'
import ErrorBoundary from '@/components/admin/ErrorBoundary'
import { Suspense } from 'react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminNav />
        <div className="flex-1">
          <header className="bg-orange-600 shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8">
            <ErrorBoundary>
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                  </div>
                </div>
              }>
                {children}
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  )
}