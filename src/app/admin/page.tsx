import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import StatsCard from '@/components/admin/StatsCard'
import { getRecentAdminActivity } from '@/lib/audit/logger'

async function getAdminStats() {
  const [totalBooks, totalUsers, totalEditions, fictionCount] = await Promise.all([
    prisma.book.count(),
    prisma.user.count(),
    prisma.edition.count(),
    prisma.book.count({
      where: { bookType: 'FICTION' }
    }),
  ])

  return {
    totalBooks,
    totalUsers,
    totalEditions,
    booksByType: {
      fiction: fictionCount,
      nonFiction: totalBooks - fictionCount,
    },
  }
}

export default async function AdminDashboard() {
  const user = await requireAdmin()
  const stats = await getAdminStats()
  const recentActivity = await getRecentAdminActivity(10)

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome, {user.name || user.email}!
        </h2>
        <p className="text-gray-600 mt-2">
          {user.isSuperAdmin ? 'Super Admin' : 'Admin'} Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Books"
          value={stats.totalBooks}
          icon="book"
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon="users"
        />
        <StatsCard
          title="Total Editions"
          value={stats.totalEditions}
          icon="editions"
        />
        <StatsCard
          title="Fiction Books"
          value={stats.booksByType.fiction}
          subtitle={`${Math.round((stats.booksByType.fiction / stats.totalBooks) * 100)}% of total`}
          icon="fiction"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Admin Activity</h3>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 py-2 border-b last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.admin?.name || activity.admin?.email}</span>
                    {' '}
                    <span className="text-gray-600">
                      {activity.actionType.toLowerCase()}d {activity.entityType}
                    </span>
                  </p>
                  {activity.fieldName && (
                    <p className="text-xs text-gray-500 mt-1">
                      Changed {activity.fieldName}: {activity.oldValue} → {activity.newValue}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  )
}