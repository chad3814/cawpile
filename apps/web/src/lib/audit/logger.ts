import { prisma } from '@/lib/prisma'
import { AuditLogEntry } from '@/types/admin'

export async function logAdminAction(
  adminId: string,
  entry: AuditLogEntry
) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        fieldName: entry.fieldName,
        oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
        newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
        actionType: entry.actionType,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log entry:', error)
  }
}

export async function logFieldChanges(
  adminId: string,
  entityType: string,
  entityId: string,
  changes: Record<string, { old: unknown; new: unknown }>
) {
  const entries = Object.entries(changes).map(([fieldName, values]) => ({
    adminId,
    entityType,
    entityId,
    fieldName,
    oldValue: values.old ? JSON.stringify(values.old) : null,
    newValue: values.new ? JSON.stringify(values.new) : null,
    actionType: 'UPDATE' as const,
  }))

  try {
    await prisma.adminAuditLog.createMany({
      data: entries,
    })
  } catch (error) {
    console.error('Failed to create audit log entries:', error)
  }
}

interface RawAuditEntry {
  id: string
  adminId: string | null
  entityType: string
  entityId: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  actionType: string
  timestamp: Date
  admin?: {
    name: string | null
    email: string
  } | null
}

export function formatAuditEntry(entry: RawAuditEntry) {
  return {
    ...entry,
    oldValue: entry.oldValue ? JSON.parse(entry.oldValue) : null,
    newValue: entry.newValue ? JSON.parse(entry.newValue) : null,
  }
}

export async function getRecentAdminActivity(limit: number = 10) {
  const activities = await prisma.adminAuditLog.findMany({
    take: limit,
    orderBy: { timestamp: 'desc' },
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  return activities.map(formatAuditEntry)
}