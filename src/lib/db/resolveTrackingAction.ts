import { BookStatus } from '@prisma/client'

export type TrackAction =
  | { kind: 'create' }
  | { kind: 'noop'; userBookId: string }
  | { kind: 'update'; userBookId: string }
  | { kind: 'reread'; readNumber: number }

/** The latest (highest readNumber) UserBook for a (user, edition), or null. */
export interface LatestUserBook {
  id: string
  status: BookStatus
  readNumber: number
}

export function isTerminalStatus(status: BookStatus): boolean {
  return status === BookStatus.COMPLETED || status === BookStatus.DNF
}

/**
 * Decide what happens when a user tracks a book they may already have tracked.
 * - No existing record -> create a first record.
 * - Latest is terminal (COMPLETED/DNF) -> always a re-read (new record).
 * - Latest is live and same status -> no-op.
 * - Latest is live and different status -> update the existing record in place.
 */
export function resolveTrackingAction(
  latest: LatestUserBook | null,
  requestedStatus: BookStatus,
): TrackAction {
  if (!latest) {
    return { kind: 'create' }
  }
  if (isTerminalStatus(latest.status)) {
    return { kind: 'reread', readNumber: latest.readNumber + 1 }
  }
  if (latest.status === requestedStatus) {
    return { kind: 'noop', userBookId: latest.id }
  }
  return { kind: 'update', userBookId: latest.id }
}
