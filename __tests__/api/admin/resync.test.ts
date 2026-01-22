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

// Mock the SearchOrchestrator and providers
jest.mock('@/lib/search/SearchOrchestrator', () => ({
  SearchOrchestrator: jest.fn().mockImplementation(() => ({
    registerProvider: jest.fn(),
    search: jest.fn(),
  })),
}))

jest.mock('@/lib/search/providers/LocalDatabaseProvider', () => ({
  LocalDatabaseProvider: jest.fn(),
}))

jest.mock('@/lib/search/providers/GoogleBooksProvider', () => ({
  GoogleBooksProvider: jest.fn(),
}))

jest.mock('@/lib/search/providers/IbdbProvider', () => ({
  IbdbProvider: jest.fn(),
}))

jest.mock('@/lib/search/providers/HardcoverProvider', () => ({
  HardcoverProvider: jest.fn(),
}))

import { getCurrentUser } from '@/lib/auth/admin'
import { SearchOrchestrator } from '@/lib/search/SearchOrchestrator'
import { POST } from '@/app/api/admin/books/[id]/resync/route'
import { NextRequest } from 'next/server'

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const MockSearchOrchestrator = SearchOrchestrator as jest.MockedClass<typeof SearchOrchestrator>

describe('Admin Resync API Endpoint', () => {
  let testUserId: string
  let testBookId: string
  let testEditionId: string

  beforeAll(async () => {
    // Create test admin user
    const user = await prisma.user.create({
      data: {
        email: `test-resync-admin-${nanoid(6)}@test.com`,
        name: 'Test Resync Admin',
        isAdmin: true,
      },
    })
    testUserId = user.id

    // Create test book
    const book = await prisma.book.create({
      data: {
        title: `Test Book Resync ${nanoid(6)}`,
        authors: ['Test Author'],
      },
    })
    testBookId = book.id

    // Create test edition
    const edition = await prisma.edition.create({
      data: {
        bookId: book.id,
        isbn13: `978${nanoid(10)}`,
      },
    })
    testEditionId = edition.id
  })

  afterAll(async () => {
    // Clean up test data - use adminId for AdminAuditLog
    await prisma.adminAuditLog.deleteMany({
      where: { adminId: testUserId },
    })
    await prisma.googleBook.deleteMany({
      where: { editionId: testEditionId },
    })
    await prisma.hardcoverBook.deleteMany({
      where: { editionId: testEditionId },
    })
    await prisma.ibdbBook.deleteMany({
      where: { editionId: testEditionId },
    })
    await prisma.edition.deleteMany({
      where: { bookId: testBookId },
    })
    await prisma.book.deleteMany({
      where: { id: testBookId },
    })
    await prisma.user.deleteMany({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  afterEach(async () => {
    // Clean up provider records after each test
    await prisma.googleBook.deleteMany({
      where: { editionId: testEditionId },
    })
    await prisma.hardcoverBook.deleteMany({
      where: { editionId: testEditionId },
    })
    await prisma.ibdbBook.deleteMany({
      where: { editionId: testEditionId },
    })
    jest.clearAllMocks()
  })

  describe('POST /api/admin/books/[id]/resync', () => {
    test('should return 403 if user is not an admin', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'test@test.com',
        name: 'Test User',
        isAdmin: false,
        isSuperAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/admin/books/test/resync', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: testEditionId })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized - Admin access required')
    })

    test('should return 403 if user is not authenticated', async () => {
      mockGetCurrentUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/books/test/resync', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: testEditionId })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized - Admin access required')
    })

    test('should return 404 if edition not found', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'admin@test.com',
        name: 'Admin User',
        isAdmin: true,
        isSuperAdmin: false,
      })

      const request = new NextRequest('http://localhost:3000/api/admin/books/test/resync', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: 'non-existent-edition-id' })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Edition not found')
    })

    test('should include all three providers (google, hardcover, ibdb) in summary when search returns results', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'admin@test.com',
        name: 'Admin User',
        isAdmin: true,
        isSuperAdmin: false,
      })

      // Mock the search orchestrator to return results with sources
      const mockOrchestrator = {
        registerProvider: jest.fn(),
        search: jest.fn().mockResolvedValue([
          {
            id: 'test-result-1',
            title: 'Test Book',
            authors: ['Test Author'],
            sources: [
              {
                provider: 'google',
                data: {
                  id: 'google-123',
                  googleId: 'google-123',
                  title: 'Test Book',
                  authors: ['Test Author'],
                  description: 'A test book description',
                },
              },
              {
                provider: 'hardcover',
                data: {
                  id: 'hardcover-123',
                  title: 'Test Book',
                  authors: ['Test Author'],
                  description: 'A test book from Hardcover',
                },
              },
              {
                provider: 'ibdb',
                data: {
                  id: 'ibdb-123',
                  title: 'Test Book',
                  authors: ['Test Author'],
                  description: 'A test book from IBDB',
                },
              },
            ],
          },
        ]),
      }
      MockSearchOrchestrator.mockImplementation(() => mockOrchestrator as never)

      const request = new NextRequest('http://localhost:3000/api/admin/books/test/resync', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: testEditionId })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.summary).toBeDefined()
      expect(data.summary.google).toBeDefined()
      expect(data.summary.hardcover).toBeDefined()
      expect(data.summary.ibdb).toBeDefined()
      expect(['created', 'updated', 'unchanged', 'not_found', null]).toContain(data.summary.google)
      expect(['created', 'updated', 'unchanged', 'not_found', null]).toContain(data.summary.hardcover)
      expect(['created', 'updated', 'unchanged', 'not_found', null]).toContain(data.summary.ibdb)
    })

    test('should return not_found for all providers when no search results', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'admin@test.com',
        name: 'Admin User',
        isAdmin: true,
        isSuperAdmin: false,
      })

      // Mock the search orchestrator to return empty results
      const mockOrchestrator = {
        registerProvider: jest.fn(),
        search: jest.fn().mockResolvedValue([]),
      }
      MockSearchOrchestrator.mockImplementation(() => mockOrchestrator as never)

      const request = new NextRequest('http://localhost:3000/api/admin/books/test/resync', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: testEditionId })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.message).toBe('No search results found for this book')
      expect(data.summary.google).toBe('not_found')
      expect(data.summary.hardcover).toBe('not_found')
      expect(data.summary.ibdb).toBe('not_found')
    })

    test('should return not_found for all providers when sources array is empty', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'admin@test.com',
        name: 'Admin User',
        isAdmin: true,
        isSuperAdmin: false,
      })

      // Mock the search orchestrator to return results without sources
      const mockOrchestrator = {
        registerProvider: jest.fn(),
        search: jest.fn().mockResolvedValue([
          {
            id: 'test-result-1',
            title: 'Test Book',
            authors: ['Test Author'],
            sources: [],
          },
        ]),
      }
      MockSearchOrchestrator.mockImplementation(() => mockOrchestrator as never)

      const request = new NextRequest('http://localhost:3000/api/admin/books/test/resync', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: testEditionId })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Search result does not include multi-provider data')
      expect(data.summary.google).toBe('not_found')
      expect(data.summary.hardcover).toBe('not_found')
      expect(data.summary.ibdb).toBe('not_found')
    })

    test('should include providerFieldCounts with all three providers', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: testUserId,
        email: 'admin@test.com',
        name: 'Admin User',
        isAdmin: true,
        isSuperAdmin: false,
      })

      // Mock the search orchestrator to return results with sources
      const mockOrchestrator = {
        registerProvider: jest.fn(),
        search: jest.fn().mockResolvedValue([
          {
            id: 'test-result-1',
            title: 'Test Book',
            authors: ['Test Author'],
            sources: [
              {
                provider: 'google',
                data: {
                  id: 'google-123',
                  googleId: 'google-123',
                  title: 'Test Book',
                  authors: ['Test Author'],
                },
              },
            ],
          },
        ]),
      }
      MockSearchOrchestrator.mockImplementation(() => mockOrchestrator as never)

      const request = new NextRequest('http://localhost:3000/api/admin/books/test/resync', {
        method: 'POST',
      })
      const params = Promise.resolve({ id: testEditionId })

      const response = await POST(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.providerFieldCounts).toBeDefined()
      expect(data.providerFieldCounts.google).toBeDefined()
      expect(data.providerFieldCounts.google.before).toBeDefined()
      expect(data.providerFieldCounts.google.after).toBeDefined()
      expect(data.providerFieldCounts.hardcover).toBeDefined()
      expect(data.providerFieldCounts.hardcover.before).toBeDefined()
      expect(data.providerFieldCounts.hardcover.after).toBeDefined()
      expect(data.providerFieldCounts.ibdb).toBeDefined()
      expect(data.providerFieldCounts.ibdb.before).toBeDefined()
      expect(data.providerFieldCounts.ibdb.after).toBeDefined()
    })
  })
})
