import { requireSuperAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import AdminUserList from '@/components/admin/AdminUserList'
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      isAdmin: true,
      isSuperAdmin: true,
      createdAt: true,
      _count: {
        select: {
          userBooks: true,
        },
      },
    },
    orderBy: [
      { isSuperAdmin: 'desc' },
      { isAdmin: 'desc' },
      { name: 'asc' },
    ],
  })

  return users
}

export default async function AdminUsersPage() {
  const currentUser = await requireSuperAdmin()
  const users = await getUsers()

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/admin" className="text-gray-500 hover:text-gray-700">
              Admin
            </Link>
          </li>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          <li className="text-gray-900">User Management</li>
        </ol>
      </nav>

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage admin privileges for users (Super Admin only)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Users
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {users.length}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Admins
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {users.filter(u => u.isAdmin).length}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Super Admins
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {users.filter(u => u.isSuperAdmin).length}
            </dd>
          </div>
        </div>
      </div>

      {/* User List */}
      <AdminUserList users={users} currentUserId={currentUser.id} />
    </div>
  )
}