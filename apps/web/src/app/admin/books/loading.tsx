import { BookTableSkeleton } from '@/components/admin/LoadingSkeletons'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>

      <div className="space-y-4">
        {/* Search and filters skeleton */}
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 rounded flex-1 max-w-lg"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>

        {/* Bulk action bar skeleton */}
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>

      <BookTableSkeleton />
    </div>
  )
}