'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BookTable from '@/components/admin/BookTable'
import BookSearch from '@/components/admin/BookSearch'
import BookFilters from '@/components/admin/BookFilters'
import Pagination from '@/components/admin/Pagination'
import BulkActionBar from '@/components/admin/BulkActionBar'
import BulkUpdateModal from '@/components/admin/BulkUpdateModal'
import { BookWithEditions } from '@/types/book'

export default function AdminBooksPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State from URL params
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit') || '25'))
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [searchField, setSearchField] = useState(searchParams.get('searchField') || 'title')
  const [bookType, setBookType] = useState(searchParams.get('bookType') || '')
  const [language, setLanguage] = useState(searchParams.get('language') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc')

  // Local state
  const [books, setBooks] = useState<BookWithEditions[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)

  // Build URL params
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (limit !== 25) params.set('limit', limit.toString())
    if (search) params.set('search', search)
    if (searchField !== 'title') params.set('searchField', searchField)
    if (bookType) params.set('bookType', bookType)
    if (language) params.set('language', language)
    if (sortBy !== 'title') params.set('sortBy', sortBy)
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder)
    return params.toString()
  }, [page, limit, search, searchField, bookType, language, sortBy, sortOrder])

  // Fetch books
  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const queryString = buildQueryString()
      const response = await fetch(`/api/admin/books?${queryString}`)

      if (response.ok) {
        const data = await response.json()
        setBooks(data.books)
        setTotalCount(data.pagination.totalCount)
        setTotalPages(data.pagination.totalPages)
      } else {
        console.error('Failed to fetch books')
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }, [buildQueryString])

  // Update URL when params change
  useEffect(() => {
    const queryString = buildQueryString()
    router.push(`/admin/books${queryString ? `?${queryString}` : ''}`)
  }, [buildQueryString, router])

  // Fetch books when params change
  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleSearch = useCallback((newSearch: string, newSearchField: string) => {
    setSearch(newSearch)
    setSearchField(newSearchField)
    setPage(1)
  }, [])

  const handleSort = (field: string) => {
    if (field === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const handleBookTypeChange = (type: string) => {
    setBookType(type)
    setPage(1)
  }

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setPage(1)
  }

  const handleResetFilters = () => {
    setBookType('')
    setLanguage('')
    setPage(1)
  }

  const handleSelectionChange = (bookId: string, selected: boolean) => {
    const newSelection = new Set(selectedBooks)
    if (selected && newSelection.size < 100) {
      newSelection.add(bookId)
    } else {
      newSelection.delete(bookId)
    }
    setSelectedBooks(newSelection)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const newSelection = new Set<string>()
      const maxBooks = Math.min(books.length, 100 - selectedBooks.size)
      books.slice(0, maxBooks).forEach(book => {
        newSelection.add(book.id)
      })
      setSelectedBooks(newSelection)
    } else {
      setSelectedBooks(new Set())
    }
  }

  const handleClearSelection = () => {
    setSelectedBooks(new Set())
  }

  const handleChangeType = () => {
    setShowBulkModal(true)
  }

  const handleBulkUpdate = async (bookType: 'FICTION' | 'NONFICTION') => {
    try {
      const response = await fetch('/api/admin/books/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookIds: Array.from(selectedBooks),
          bookType,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`Updated ${result.updated} books`)

        // Clear selection and refresh the list
        setSelectedBooks(new Set())
        await fetchBooks()
      } else {
        console.error('Failed to update books')
      }
    } catch (error) {
      console.error('Error updating books:', error)
    }
  }

  const handleRefresh = useCallback(() => {
    fetchBooks()
  }, [fetchBooks])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manage Books</h2>
        <p className="mt-1 text-sm text-gray-600">
          Search, filter, and edit book information
        </p>
      </div>

      <div className="space-y-4">
        <BookSearch
          onSearch={handleSearch}
          initialSearch={search}
          initialSearchField={searchField}
        />

        <BookFilters
          bookType={bookType}
          language={language}
          onBookTypeChange={handleBookTypeChange}
          onLanguageChange={handleLanguageChange}
          onReset={handleResetFilters}
        />

        <BulkActionBar
          selectedCount={selectedBooks.size}
          onChangeType={handleChangeType}
          onClearSelection={handleClearSelection}
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="inline-flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading books...
          </div>
        </div>
      ) : (
        <>
          <BookTable
            books={books}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            selectedBooks={selectedBooks}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
            onRefresh={handleRefresh}
          />

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              totalCount={totalCount}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          )}
        </>
      )}

      <BulkUpdateModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedCount={selectedBooks.size}
        onConfirm={handleBulkUpdate}
      />
    </div>
  )
}
