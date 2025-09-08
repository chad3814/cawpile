'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PencilIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

interface Book {
  id: string
  title: string
  authors: string[]
  bookType: string
  language: string
  userCount: number
  editions: any[]
}

interface BookTableProps {
  books: Book[]
  onSort: (field: string) => void
  sortBy: string
  sortOrder: 'asc' | 'desc'
  selectedBooks: Set<string>
  onSelectionChange: (bookId: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
}

export default function BookTable({
  books,
  onSort,
  sortBy,
  sortOrder,
  selectedBooks,
  onSelectionChange,
  onSelectAll
}: BookTableProps) {
  const [allChecked, setAllChecked] = useState(false)

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
          {books.map((book) => (
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
                <Link
                  href={`/admin/books/${book.id}`}
                  className="text-orange-600 hover:text-orange-900 inline-flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}