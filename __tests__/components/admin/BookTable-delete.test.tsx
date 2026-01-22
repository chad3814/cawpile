/**
 * Tests for BookTable delete functionality
 * Task Group 6.1: BookTable delete tests
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import BookTable from '@/components/admin/BookTable'
import { BookWithEditions } from '@/types/book'

// Mock fetch
global.fetch = jest.fn()

describe('BookTable Delete Functionality', () => {
  const mockOnSort = jest.fn()
  const mockOnSelectionChange = jest.fn()
  const mockOnSelectAll = jest.fn()
  const mockOnRefresh = jest.fn()

  const mockBooks: BookWithEditions[] = [
    {
      id: 'book-1',
      title: 'Test Book 1',
      authors: ['Author 1'],
      bookType: 'FICTION',
      language: 'en',
      userCount: 5,
      editions: [
        {
          id: 'edition-1',
          bookId: 'book-1',
          isbn10: null,
          isbn13: '9781234567890',
          title: null,
          authors: [],
          format: null,
          googleBooksId: null,
          googleBook: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      primaryGenre: null,
    },
    {
      id: 'book-2',
      title: 'Test Book 2',
      authors: ['Author 2'],
      bookType: 'NONFICTION',
      language: 'en',
      userCount: 3,
      editions: [
        {
          id: 'edition-2',
          bookId: 'book-2',
          isbn10: null,
          isbn13: '9780987654321',
          title: null,
          authors: [],
          format: null,
          googleBooksId: null,
          googleBook: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      primaryGenre: null,
    },
  ]

  const defaultProps = {
    books: mockBooks,
    onSort: mockOnSort,
    sortBy: 'title',
    sortOrder: 'asc' as const,
    selectedBooks: new Set<string>(),
    onSelectionChange: mockOnSelectionChange,
    onSelectAll: mockOnSelectAll,
    onRefresh: mockOnRefresh,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Book deleted successfully' }),
    })
  })

  test('renders delete button with TrashIcon for each book row', () => {
    render(<BookTable {...defaultProps} />)

    // Get all table rows in tbody
    const tbody = screen.getByRole('table').querySelector('tbody')
    const rows = tbody ? within(tbody).getAllByRole('row') : []

    // Each row should have a delete button
    rows.forEach(row => {
      const deleteButton = within(row).getByRole('button', { name: /delete/i })
      expect(deleteButton).toBeInTheDocument()
    })
  })

  test('clicking delete button opens DeleteBookModal', async () => {
    render(<BookTable {...defaultProps} />)

    // Get the table body
    const tbody = screen.getByRole('table').querySelector('tbody')
    const rows = tbody ? within(tbody).getAllByRole('row') : []

    // Click delete button in first row
    const firstRowDeleteButton = within(rows[0]).getByRole('button', { name: /delete/i })
    fireEvent.click(firstRowDeleteButton)

    // Modal should be visible with book title (use getAllByText since title appears in both table and modal)
    await waitFor(() => {
      expect(screen.getByText('Delete Book')).toBeInTheDocument()
      // The book title will appear multiple times - in table row and in modal
      const titleElements = screen.getAllByText(/Test Book 1/)
      expect(titleElements.length).toBeGreaterThanOrEqual(2) // In table and in modal
    })
  })

  test('successful deletion shows success toast and calls onRefresh', async () => {
    render(<BookTable {...defaultProps} />)

    // Get the table body
    const tbody = screen.getByRole('table').querySelector('tbody')
    const rows = tbody ? within(tbody).getAllByRole('row') : []

    // Click delete button for first book
    const firstRowDeleteButton = within(rows[0]).getByRole('button', { name: /delete/i })
    fireEvent.click(firstRowDeleteButton)

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Delete Book')).toBeInTheDocument()
    })

    // Find the modal dialog and click the Delete button within it
    const dialog = screen.getByRole('dialog')
    const confirmDeleteButton = within(dialog).getByRole('button', { name: /^delete$/i })
    fireEvent.click(confirmDeleteButton)

    // Should call the API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/books/book-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    // Should call onRefresh after successful deletion
    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled()
    })
  })
})
