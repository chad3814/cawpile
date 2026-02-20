/**
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// Mock the auth helpers
jest.mock('@/lib/auth/admin', () => ({
  getCurrentUser: jest.fn(),
}))

// Mock the audit logger
jest.mock('@/lib/audit/logger', () => ({
  logAdminAction: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/audit/logger'
import { DELETE } from '@/app/api/admin/books/[id]/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockLogAdminAction = logAdminAction as jest.MockedFunction<typeof logAdminAction>

describe('DELETE /api/admin/books/[id]', () => {
  let testAdminId: string
  let testBookId: string

  beforeAll(async () => {
    // Create test admin user
    const admin = await prisma.user.create({
      data: {
        email: `test-admin-delete-${nanoid(6)}@test.com`,
        name: 'Test Admin User',
        isAdmin: true,
      },
    })
    testAdminId = admin.id
  })

  afterAll(async () => {
    // Clean up test admin user
    await prisma.adminAuditLog.deleteMany({
      where: { adminId: testAdminId },
    })
    await prisma.user.deleteMany({
      where: { id: testAdminId },
    })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Create a fresh test book for each test
    const book = await prisma.book.create({
      data: {
        title: `Test Book Delete ${nanoid(6)}`,
        authors: ['Test Author'],
        bookType: 'FICTION',
      },
    })
    testBookId = book.id

    // Create an edition for the book
    await prisma.edition.create({
      data: {
        bookId: testBookId,
        isbn13: `978${nanoid(10)}`,
      },
    })

    jest.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up test book data
    await prisma.edition.deleteMany({
      where: { bookId: testBookId },
    })
    await prisma.book.deleteMany({
      where: { id: testBookId },
    })
  })

  test('should delete book successfully with audit logging', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: testAdminId,
      email: 'admin@test.com',
      name: 'Test Admin',
      isAdmin: true,
      isSuperAdmin: false,
    })

    const request = new NextRequest(`http://localhost:3000/api/admin/books/${testBookId}`, {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: testBookId })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Book deleted successfully')

    // Verify book was deleted from database
    const deletedBook = await prisma.book.findUnique({
      where: { id: testBookId },
    })
    expect(deletedBook).toBeNull()

    // Verify audit logging was called
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      testAdminId,
      expect.objectContaining({
        entityType: 'Book',
        entityId: testBookId,
        actionType: 'DELETE',
      })
    )
  })

  test('should return 401 for non-admin users', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: 'regular-user-id',
      email: 'user@test.com',
      name: 'Regular User',
      isAdmin: false,
      isSuperAdmin: false,
    })

    const request = new NextRequest(`http://localhost:3000/api/admin/books/${testBookId}`, {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: testBookId })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')

    // Verify book still exists
    const book = await prisma.book.findUnique({
      where: { id: testBookId },
    })
    expect(book).not.toBeNull()
  })

  test('should return 401 for unauthenticated requests', async () => {
    mockGetCurrentUser.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost:3000/api/admin/books/${testBookId}`, {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: testBookId })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  test('should return 404 for non-existent book', async () => {
    mockGetCurrentUser.mockResolvedValue({
      id: testAdminId,
      email: 'admin@test.com',
      name: 'Test Admin',
      isAdmin: true,
      isSuperAdmin: false,
    })

    const nonExistentId = 'non-existent-book-id'
    const request = new NextRequest(`http://localhost:3000/api/admin/books/${nonExistentId}`, {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: nonExistentId })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Book not found')
  })
})
