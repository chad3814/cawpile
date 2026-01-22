'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon } from '@heroicons/react/24/outline'
import DeleteUserModal from './DeleteUserModal'

interface User {
  id: string
  email: string
  name: string | null
  username: string | null
  isAdmin: boolean
  isSuperAdmin: boolean
  createdAt: Date
  _count: {
    userBooks: number
  }
}

interface AdminUserListProps {
  users: User[]
  currentUserId: string
}

export default function AdminUserList({ users, currentUserId }: AdminUserListProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingUser, setDeletingUser] = useState<{ id: string; email: string } | null>(null)

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleAdmin = async (userId: string, newAdminStatus: boolean) => {
    if (updating) return

    // Prevent self-demotion for super admin
    if (userId === currentUserId && !newAdminStatus) {
      alert('You cannot remove your own admin privileges')
      return
    }

    const confirmed = confirm(
      `Are you sure you want to ${newAdminStatus ? 'grant' : 'revoke'} admin privileges for this user?`
    )

    if (!confirmed) return

    setUpdating(userId)

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAdmin: newAdminStatus,
        }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to update user privileges')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('An error occurred while updating user privileges')
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUser) return

    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('An error occurred while deleting user')
    }
  }

  const getDeleteButtonState = (user: User): { disabled: boolean; tooltip: string } => {
    if (user.id === currentUserId) {
      return { disabled: true, tooltip: 'Cannot delete your own account' }
    }
    if (user.isAdmin || user.isSuperAdmin) {
      return { disabled: true, tooltip: 'Cannot delete admin users' }
    }
    return { disabled: false, tooltip: 'Delete user' }
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search by name, email, or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
        />
      </div>

      {/* User List */}
      <ul className="divide-y divide-gray-200">
        {filteredUsers.map((user) => {
          const deleteState = getDeleteButtonState(user)

          return (
            <li key={user.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || 'No name'}
                      {user.username && (
                        <span className="ml-2 text-gray-500 font-normal">@{user.username}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">
                      {user._count.userBooks} books tracked
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {user.isSuperAdmin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Super Admin
                    </span>
                  )}
                  {!user.isSuperAdmin && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={user.isAdmin}
                        onChange={(e) => handleToggleAdmin(user.id, e.target.checked)}
                        disabled={updating === user.id || user.id === currentUserId}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <label className="ml-2 text-sm text-gray-900">
                        Admin
                      </label>
                    </div>
                  )}
                  <button
                    onClick={() => setDeletingUser({ id: user.id, email: user.email })}
                    disabled={deleteState.disabled}
                    title={deleteState.tooltip}
                    className="text-red-600 hover:text-red-900 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        userId={deletingUser?.id || ''}
        userEmail={deletingUser?.email || ''}
        onConfirm={handleDeleteUser}
      />
    </div>
  )
}
