'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { PencilIcon, ChevronUpIcon, ChevronDownIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline'
import { BookWithEditions } from '@/types/book'
import { useToast, ToastContainer } from './Toast'
import DeleteBookModal from './DeleteBookModal'

interface ResyncResponse {
  success: boolean
  editionId?: string
  title?: string
  summary?: {
    hardcover: 'created' | 'updated' | 'unchanged' | 'not_found' | null
    ibdb: 'created' | 'updated' | 'unchanged' | 'not_found' | null
  }
  providerFieldCounts?: {
    hardcover: { before: number; after: number }
    ibdb: { before: number; after: number }
  }
  errors?: string[]
  error?: string
  message?: string
}

interface BookTableProps {
  books: BookWithEditions[]
  onSort: (field: string) => void
  sortBy: string
  sortOrder: 'asc' | 'desc'
  selectedBooks: Set<string>
  onSelectionChange: (bookId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onRefresh?: () => void
}

export default function BookTable({
  books,
  onSort,
  sortBy,
  sortOrder,
  selectedBooks,
  onSelectionChange,
  onSelectAll,
  onRefresh
}: BookTableProps) {
  const [allChecked, setAllChecked] = useState(false)
  const [resyncingEditions, setResyncingEditions] = useState<Set<string>>(new Set())
  const [deletingBook, setDeletingBook] = useState<{ id: string; title: string } | null>(null)
  const { messages, showToast, removeToast } = useToast()

  const handleSelectAll = (checked: boolean) => {
    setAllChecked(checked)
    onSelectAll(checked)
  }

  const handleBookSelect = (bookId: string, checked: boolean) => {
    onSelectionChange(bookId, checked)
    if (!checked && allChecked) {
      setAllChecked(false)
    }
  }

  const handleResync = useCallback(async (editionId: string, bookTitle: string) => {
    // Add to resyncing set
    setResyncingEditions(prev => new Set(prev).add(editionId))

    try {
      const response = await fetch(`/api/admin/books/${editionId}/resync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data: ResyncResponse = await response.json()

      if (!response.ok) {
        showToast('error', data.error || data.message || 'Failed to resync book')
        return
      }

      if (data.success) {
        // Build summary message
        const summaryParts: string[] = []
        if (data.summary?.hardcover && data.summary.hardcover !== 'not_found') {
          summaryParts.push(`Hardcover: ${data.summary.hardcover}`)
        }
        if (data.summary?.ibdb && data.summary.ibdb !== 'not_found') {
          summaryParts.push(`IBDB: ${data.summary.ibdb}`)
        }

        const summaryMessage = summaryParts.length > 0
          ? `${bookTitle} - ${summaryParts.join(', ')}`
          : `${bookTitle} - No provider updates available`

        showToast('success', summaryMessage)
      } else {
        showToast('error', data.message || 'Resync completed with issues')
      }
    } catch (error) {
      console.error('Resync error:', error)
      showToast('error', `Failed to resync "${bookTitle}"`)
    } finally {
      // Remove from resyncing set
      setResyncingEditions(prev => {
        const next = new Set(prev)
        next.delete(editionId)
        return next
      })
    }
  }, [showToast])

  const handleDelete = useCallback(async () => {
    if (!deletingBook) return

    try {
      const response = await fetch(`/api/admin/books/${deletingBook.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        showToast('error', data.error || 'Failed to delete book')
        return
      }

      showToast('success', `"${deletingBook.title}" has been deleted`)
      onRefresh?.()
    } catch (error) {
      console.error('Delete error:', error)
      showToast('error', `Failed to delete "${deletingBook.title}"`)
    }
  }, [deletingBook, showToast, onRefresh])

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ?
      <ChevronUpIcon className="h-4 w-4 inline ml-1" /> :
      <ChevronDownIcon className="h-4 w-4 inline ml-1" />
  }

  if (books.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No books found</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('title')}
              >
                Title <SortIcon field="title" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('authors')}
              >
                Authors <SortIcon field="authors" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('bookType')}
              >
                Type <SortIcon field="bookType" />
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('language')}
              >
                Language <SortIcon field="language" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Users
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {books.map((book) => {
              // Get the first edition ID for the resync button
              const primaryEditionId = book.editions?.[0]?.id
              const isResyncing = primaryEditionId ? resyncingEditions.has(primaryEditionId) : false

              return (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedBooks.has(book.id)}
                      onChange={(e) => handleBookSelect(book.id, e.target.checked)}
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      disabled={selectedBooks.size >= 100 && !selectedBooks.has(book.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {book.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {book.authors.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      book.bookType === 'FICTION'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {book.bookType === 'FICTION' ? 'Fiction' : 'Non-Fiction'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {book.language.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {book.userCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/admin/books/${book.id}`}
                        className="text-orange-600 hover:text-orange-900 inline-flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      {primaryEditionId && (
                        <button
                          onClick={() => handleResync(primaryEditionId, book.title)}
                          disabled={isResyncing}
                          className="text-blue-600 hover:text-blue-900 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Re-sync provider data"
                        >
                          <ArrowPathIcon
                            className={`h-4 w-4 mr-1 ${isResyncing ? 'animate-spin' : ''}`}
                          />
                          {isResyncing ? 'Syncing...' : 'Re-sync'}
                        </button>
                      )}
                      <button
                        onClick={() => setDeletingBook({ id: book.id, title: book.title })}
                        className="text-red-600 hover:text-red-900 inline-flex items-center"
                        title="Delete book"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Book Modal */}
      <DeleteBookModal
        isOpen={deletingBook !== null}
        onClose={() => setDeletingBook(null)}
        bookTitle={deletingBook?.title || ''}
        bookId={deletingBook?.id || ''}
        onConfirm={handleDelete}
      />

      <ToastContainer messages={messages} onClose={removeToast} />
    </>
  )
}
