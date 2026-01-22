/**
 * @jest-environment node
 */

import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// Mock the auth helpers
jest.mock('@/lib/auth/admin', () => ({
  requireSuperAdmin: jest.fn(),
}))

// Mock the audit logger
jest.mock('@/lib/audit/logger', () => ({
  logAdminAction: jest.fn(),
}))

import { requireSuperAdmin } from '@/lib/auth/admin'
import { logAdminAction } from '@/lib/audit/logger'
import { DELETE } from '@/app/api/admin/users/[id]/route'
import { NextRequest } from 'next/server'

const mockRequireSuperAdmin = requireSuperAdmin as jest.MockedFunction<typeof requireSuperAdmin>
const mockLogAdminAction = logAdminAction as jest.MockedFunction<typeof logAdminAction>

describe('DELETE /api/admin/users/[id]', () => {
  let testSuperAdminId: string
  let testRegularUserId: string
  let testAdminUserId: string

  beforeAll(async () => {
    // Create test super admin user
    const superAdmin = await prisma.user.create({
      data: {
        email: `test-super-admin-${nanoid(6)}@test.com`,
        name: 'Test Super Admin',
        isAdmin: true,
        isSuperAdmin: true,
      },
    })
    testSuperAdminId = superAdmin.id

    // Create test admin user (should not be deletable)
    const admin = await prisma.user.create({
      data: {
        email: `test-admin-user-${nanoid(6)}@test.com`,
        name: 'Test Admin User',
        isAdmin: true,
        isSuperAdmin: false,
      },
    })
    testAdminUserId = admin.id
  })

  afterAll(async () => {
    // Clean up test users
    await prisma.adminAuditLog.deleteMany({
      where: { adminId: testSuperAdminId },
    })
    await prisma.user.deleteMany({
      where: { id: { in: [testSuperAdminId, testAdminUserId] } },
    })
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Create a fresh regular user for each test
    const regularUser = await prisma.user.create({
      data: {
        email: `test-regular-${nanoid(6)}@test.com`,
        name: 'Test Regular User',
        isAdmin: false,
        isSuperAdmin: false,
      },
    })
    testRegularUserId = regularUser.id

    jest.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up test regular user if it still exists
    await prisma.user.deleteMany({
      where: { id: testRegularUserId },
    })
  })

  test('should delete regular user successfully with audit logging', async () => {
    mockRequireSuperAdmin.mockResolvedValue({
      id: testSuperAdminId,
      email: 'superadmin@test.com',
      name: 'Test Super Admin',
      isAdmin: true,
      isSuperAdmin: true,
    })

    const request = new NextRequest(`http://localhost:3000/api/admin/users/${testRegularUserId}`, {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: testRegularUserId })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('User deleted successfully')

    // Verify user was deleted from database
    const deletedUser = await prisma.user.findUnique({
      where: { id: testRegularUserId },
    })
    expect(deletedUser).toBeNull()

    // Verify audit logging was called
    expect(mockLogAdminAction).toHaveBeenCalledWith(
      testSuperAdminId,
      expect.objectContaining({
        entityType: 'User',
        entityId: testRegularUserId,
        actionType: 'DELETE',
      })
    )
  })

  test('should return 401 for non-super-admin users', async () => {
    // Mock requireSuperAdmin throwing (redirect behavior)
    mockRequireSuperAdmin.mockRejectedValue(new Response(null, { status: 401 }))

    const request = new NextRequest(`http://localhost:3000/api/admin/users/${testRegularUserId}`, {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: testRegularUserId })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: testRegularUserId },
    })
    expect(user).not.toBeNull()
  })

  test('should return 400 when attempting to delete admin user', async () => {
    mockRequireSuperAdmin.mockResolvedValue({
      id: testSuperAdminId,
      email: 'superadmin@test.com',
      name: 'Test Super Admin',
      isAdmin: true,
      isSuperAdmin: true,
    })

    const request = new NextRequest(`http://localhost:3000/api/admin/users/${testAdminUserId}`, {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: testAdminUserId })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Cannot delete admin users')

    // Verify admin user still exists
    const adminUser = await prisma.user.findUnique({
      where: { id: testAdminUserId },
    })
    expect(adminUser).not.toBeNull()
  })

  test('should return 400 when attempting self-deletion', async () => {
    mockRequireSuperAdmin.mockResolvedValue({
      id: testSuperAdminId,
      email: 'superadmin@test.com',
      name: 'Test Super Admin',
      isAdmin: true,
      isSuperAdmin: true,
    })

    const request = new NextRequest(`http://localhost:3000/api/admin/users/${testSuperAdminId}`, {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: testSuperAdminId })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Cannot delete your own account')

    // Verify super admin still exists
    const superAdmin = await prisma.user.findUnique({
      where: { id: testSuperAdminId },
    })
    expect(superAdmin).not.toBeNull()
  })

  test('should return 404 for non-existent user', async () => {
    mockRequireSuperAdmin.mockResolvedValue({
      id: testSuperAdminId,
      email: 'superadmin@test.com',
      name: 'Test Super Admin',
      isAdmin: true,
      isSuperAdmin: true,
    })

    const nonExistentId = 'non-existent-user-id'
    const request = new NextRequest(`http://localhost:3000/api/admin/users/${nonExistentId}`, {
      method: 'DELETE',
    })
    const params = Promise.resolve({ id: nonExistentId })

    const response = await DELETE(request, { params })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })
})
