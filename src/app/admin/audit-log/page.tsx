import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { formatAuditEntry } from '@/lib/audit/logger'
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/outline'

async function getAuditLogs(page: number = 1, limit: number = 50) {
  const skip = (page - 1) * limit
  
  const [logs, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      take: limit,
      skip,
      orderBy: { timestamp: 'desc' },
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.adminAuditLog.count(),
  ])

  return {
    logs: logs.map(formatAuditEntry),
    total,
    totalPages: Math.ceil(total / limit),
  }
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  await requireAdmin()
  
  const page = parseInt(searchParams.page || '1')
  const { logs, total, totalPages } = await getAuditLogs(page)

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      case 'MERGE':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

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
          <li className="text-gray-900">Audit Log</li>
        </ol>
      </nav>

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
        <p className="mt-1 text-sm text-gray-600">
          Complete history of all administrative actions
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {logs.map((log) => (
            <li key={log.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">
                      {log.admin?.name || log.admin?.email || 'Unknown Admin'}
                    </p>
                    <span
                      className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(
                        log.actionType
                      )}`}
                    >
                      {log.actionType}
                    </span>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <p className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Entity:</span>
                      <span className="ml-1">{log.entityType} ({log.entityId})</span>
                    </p>
                  </div>
                </div>
                {log.fieldName && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Field:</span> {log.fieldName}
                    </p>
                    <div className="mt-1 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Old Value:</p>
                        <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {formatValue(log.oldValue)}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">New Value:</p>
                        <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {formatValue(log.newValue)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            {page > 1 && (
              <Link
                href={`/admin/audit-log?page=${page - 1}`}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/audit-log?page=${page + 1}`}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing page <span className="font-medium">{page}</span> of{' '}
                <span className="font-medium">{totalPages}</span> ({total} total entries)
              </p>
            </div>
            <div className="flex space-x-2">
              {page > 1 && (
                <Link
                  href={`/admin/audit-log?page=${page - 1}`}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/audit-log?page=${page + 1}`}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}