export function StatsCardSkeleton() {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
      <div className="px-4 py-5 sm:p-6">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  )
}

export function BookTableSkeleton() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md animate-pulse">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
      <ul className="divide-y divide-gray-200">
        {[...Array(5)].map((_, i) => (
          <li key={i} className="px-4 py-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded"></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ActivityFeedSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="py-2 border-b last:border-0">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DataQualitySkeleton() {
  return (
    <div className="bg-white shadow rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 bg-gray-200 rounded w-32"></div>
        <div className="text-right">
          <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2">
            <div className="flex items-center space-x-2">
              <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-4 w-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UserListSkeleton() {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md animate-pulse">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
      <ul className="divide-y divide-gray-200">
        {[...Array(5)].map((_, i) => (
          <li key={i} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="ml-4 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                  <div className="h-2 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}