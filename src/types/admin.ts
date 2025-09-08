export interface AdminUser {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  isSuperAdmin: boolean
}

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'MERGE'

export interface AuditLogEntry {
  entityType: string
  entityId: string
  fieldName?: string
  oldValue?: unknown
  newValue?: unknown
  actionType: AuditActionType
}

export interface AdminStats {
  totalBooks: number
  totalUsers: number
  totalEditions: number
  booksByType: {
    fiction: number
    nonFiction: number
  }
}

export interface DataQualityIssue {
  type: 'MISSING_ISBN' | 'NO_CATEGORIES' | 'NO_GOOGLE_BOOKS' | 'POTENTIAL_DUPLICATE'
  count: number
  bookIds: string[]
}