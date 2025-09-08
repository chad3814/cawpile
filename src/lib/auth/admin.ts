import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      isSuperAdmin: true,
    },
  })

  return user
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