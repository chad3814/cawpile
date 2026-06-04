import { BookStatus } from '@prisma/client'
import { resolveTrackingAction } from '@/lib/db/resolveTrackingAction'

const { WANT_TO_READ, READING, COMPLETED, DNF } = BookStatus
const allStatuses = [WANT_TO_READ, READING, COMPLETED, DNF] as const

function latest(status: BookStatus, readNumber = 1) {
  return { id: 'ub1', status, readNumber }
}

describe('resolveTrackingAction', () => {
  it('creates when there is no existing record', () => {
    for (const s of allStatuses) {
      expect(resolveTrackingAction(null, s)).toEqual({ kind: 'create' })
    }
  })

  it('re-reads for every requested status when latest is COMPLETED', () => {
    for (const s of allStatuses) {
      expect(resolveTrackingAction(latest(COMPLETED, 2), s)).toEqual({ kind: 'reread', readNumber: 3 })
    }
  })

  it('re-reads for every requested status when latest is DNF', () => {
    for (const s of allStatuses) {
      expect(resolveTrackingAction(latest(DNF, 1), s)).toEqual({ kind: 'reread', readNumber: 2 })
    }
  })

  it('no-ops when latest and requested are both WANT_TO_READ', () => {
    expect(resolveTrackingAction(latest(WANT_TO_READ), WANT_TO_READ)).toEqual({ kind: 'noop', userBookId: 'ub1' })
  })

  it('no-ops when latest and requested are both READING', () => {
    expect(resolveTrackingAction(latest(READING), READING)).toEqual({ kind: 'noop', userBookId: 'ub1' })
  })

  it('updates TBR -> READING / COMPLETED / DNF', () => {
    for (const s of [READING, COMPLETED, DNF]) {
      expect(resolveTrackingAction(latest(WANT_TO_READ), s)).toEqual({ kind: 'update', userBookId: 'ub1' })
    }
  })

  it('updates READING -> TBR / COMPLETED / DNF', () => {
    for (const s of [WANT_TO_READ, COMPLETED, DNF]) {
      expect(resolveTrackingAction(latest(READING), s)).toEqual({ kind: 'update', userBookId: 'ub1' })
    }
  })
})
