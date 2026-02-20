import { getCurrentUser as getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const user = await getAuthUser()
  if (!user) return null
  
  return {
    id: user.id,
    email: user.email!,
    name: user.name,
    isAdmin: user.isAdmin || false,
    isSuperAdmin: user.isSuperAdmin || false,
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })

  return user?.isAdmin ?? false
}

export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  })

  return user?.isSuperAdmin ?? false
}

export async function requireAdmin() {
  const user = await getCurrentUser()

  if (!user || !user.isAdmin) {
    redirect('/')
  }

  return user
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser()

  if (!user || !user.isSuperAdmin) {
    redirect('/')
  }

  return user
}

export async function checkAdminAccess(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.isAdmin ?? false
}

export async function checkSuperAdminAccess(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.isSuperAdmin ?? false
}