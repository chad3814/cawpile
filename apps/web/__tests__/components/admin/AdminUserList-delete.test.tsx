/**
 * Tests for AdminUserList delete functionality
 * Task Group 7.1: AdminUserList delete tests
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminUserList from '@/components/admin/AdminUserList'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('AdminUserList Delete Functionality', () => {
  const currentUserId = 'current-user-id'

  const mockUsers = [
    {
      id: 'regular-user-1',
      email: 'regular@example.com',
      name: 'Regular User',
      username: 'regularuser',
      isAdmin: false,
      isSuperAdmin: false,
      createdAt: new Date(),
      _count: { userBooks: 5 },
    },
    {
      id: 'admin-user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      username: 'adminuser',
      isAdmin: true,
      isSuperAdmin: false,
      createdAt: new Date(),
      _count: { userBooks: 10 },
    },
    {
      id: 'super-admin-1',
      email: 'super@example.com',
      name: 'Super Admin',
      username: 'superadmin',
      isAdmin: true,
      isSuperAdmin: true,
      createdAt: new Date(),
      _count: { userBooks: 15 },
    },
    {
      id: currentUserId,
      email: 'me@example.com',
      name: 'Current User',
      username: 'currentuser',
      isAdmin: true,
      isSuperAdmin: true,
      createdAt: new Date(),
      _count: { userBooks: 8 },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'User deleted successfully' }),
    })
  })

  test('renders delete button for non-admin users', () => {
    render(<AdminUserList users={mockUsers} currentUserId={currentUserId} />)

    // Find delete buttons - should have one enabled for regular user
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

    // All users should have delete buttons
    expect(deleteButtons).toHaveLength(4)
  })

  test('delete button is disabled for admin users with tooltip', () => {
    render(<AdminUserList users={mockUsers} currentUserId={currentUserId} />)

    // Find all delete buttons
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

    // Find the button for admin user (second in list)
    const adminDeleteButton = deleteButtons[1]
    expect(adminDeleteButton).toBeDisabled()
    expect(adminDeleteButton).toHaveAttribute('title', 'Cannot delete admin users')
  })

  test('delete button is disabled for current user with tooltip', () => {
    render(<AdminUserList users={mockUsers} currentUserId={currentUserId} />)

    // Find all delete buttons
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

    // Find the button for current user (fourth in list)
    const currentUserDeleteButton = deleteButtons[3]
    expect(currentUserDeleteButton).toBeDisabled()
    expect(currentUserDeleteButton).toHaveAttribute('title', 'Cannot delete your own account')
  })

  test('clicking enabled delete button opens DeleteUserModal', async () => {
    // Mock the stats API
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ booksCount: 5, sharedReviewsCount: 2 }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'User deleted successfully' }),
      })
    })

    render(<AdminUserList users={mockUsers} currentUserId={currentUserId} />)

    // Find delete buttons
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

    // Click the first delete button (regular user - should be enabled)
    const regularUserDeleteButton = deleteButtons[0]
    expect(regularUserDeleteButton).not.toBeDisabled()

    fireEvent.click(regularUserDeleteButton)

    // Modal should be visible with title and user email shown in modal (there will be multiple matches since email is also in the list)
    await waitFor(() => {
      expect(screen.getByText('Delete User')).toBeInTheDocument()
      // Use getAllByText since email appears in both the list and the modal
      const emailElements = screen.getAllByText(/regular@example.com/)
      expect(emailElements.length).toBeGreaterThanOrEqual(2) // In list and in modal
    })
  })

  test('delete button is disabled for super admin users', () => {
    render(<AdminUserList users={mockUsers} currentUserId={currentUserId} />)

    // Find all delete buttons
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i })

    // Find the button for super admin user (third in list)
    const superAdminDeleteButton = deleteButtons[2]
    expect(superAdminDeleteButton).toBeDisabled()
    expect(superAdminDeleteButton).toHaveAttribute('title', 'Cannot delete admin users')
  })
})
