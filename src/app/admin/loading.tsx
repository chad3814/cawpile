import { StatsCardSkeleton, ActivityFeedSkeleton, DataQualitySkeleton } from '@/components/admin/LoadingSkeletons'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeedSkeleton />
        </div>
        <div className="lg:col-span-1">
          <DataQualitySkeleton />
        </div>
      </div>
    </div>
  )
}