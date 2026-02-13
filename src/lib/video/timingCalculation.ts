/**
 * Timing Auto-Calculation Utility
 *
 * Computes sub-timings proportionally from sequence totals,
 * preserving the ratios from DEFAULT_TEMPLATE.
 */

import { DEFAULT_TEMPLATE } from '@/types/video-template'
import type { ResolvedTimingConfig } from '@/types/video-template'

// ============================================================================
// Sequence Definitions
// ============================================================================

/**
 * Each sequence maps a total key to its sub-timing keys and their default ratios.
 * Ratios are computed once from DEFAULT_TEMPLATE values.
 */

type SequenceKey = 'intro' | 'book' | 'stats' | 'comingSoon' | 'outro'

interface SequenceDefinition {
  totalKey: keyof ResolvedTimingConfig
  subKeys: (keyof ResolvedTimingConfig)[]
}

const SEQUENCE_DEFINITIONS: Record<SequenceKey, SequenceDefinition> = {
  intro: {
    totalKey: 'introTotal',
    subKeys: ['introFadeIn', 'introHold', 'introFadeOut'],
  },
  book: {
    totalKey: 'bookTotal',
    subKeys: ['bookSlideIn', 'bookTitleType', 'bookRatingCount', 'bookHold', 'bookExit'],
  },
  stats: {
    totalKey: 'statsTotal',
    subKeys: ['statsCountUp', 'statsHold', 'statsFadeOut'],
  },
  comingSoon: {
    totalKey: 'comingSoonTotal',
    subKeys: ['comingSoonFadeIn', 'comingSoonHold', 'comingSoonFadeOut'],
  },
  outro: {
    totalKey: 'outroTotal',
    subKeys: ['outroFadeIn', 'outroHold', 'outroFadeOut'],
  },
}

// ============================================================================
// Default Ratios (computed once from DEFAULT_TEMPLATE)
// ============================================================================

function computeDefaultRatios(): Record<SequenceKey, number[]> {
  const timing = DEFAULT_TEMPLATE.global.timing
  const ratios: Record<string, number[]> = {}

  for (const [key, def] of Object.entries(SEQUENCE_DEFINITIONS)) {
    const total = timing[def.totalKey]
    ratios[key] = def.subKeys.map((subKey) => timing[subKey] / total)
  }

  return ratios as Record<SequenceKey, number[]>
}

const DEFAULT_RATIOS = computeDefaultRatios()

// ============================================================================
// Public API
// ============================================================================

/**
 * Calculate sub-timings for a given sequence from a new total,
 * distributing proportionally based on default ratios.
 *
 * Rounds to nearest integer and adjusts the largest sub-timing
 * if rounding causes the sum to drift from the total.
 */
export function calculateSubTimings(
  sequenceKey: SequenceKey,
  newTotal: number
): Record<string, number> {
  const def = SEQUENCE_DEFINITIONS[sequenceKey]
  const ratios = DEFAULT_RATIOS[sequenceKey]

  // Calculate raw (rounded) values
  const values = ratios.map((ratio) => Math.round(ratio * newTotal))

  // Fix rounding drift: adjust the largest value so sum === newTotal
  const currentSum = values.reduce((a, b) => a + b, 0)
  const drift = currentSum - newTotal

  if (drift !== 0) {
    // Find the index of the largest value to absorb the correction
    let largestIndex = 0
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[largestIndex]) {
        largestIndex = i
      }
    }
    values[largestIndex] -= drift
  }

  // Build the result object
  const result: Record<string, number> = {}
  for (let i = 0; i < def.subKeys.length; i++) {
    result[def.subKeys[i]] = values[i]
  }

  return result
}

/**
 * Input for assembleFullTimingConfig: the 6 admin-editable values
 */
export interface TimingTotals {
  introTotal: number
  bookTotal: number
  statsTotal: number
  comingSoonTotal: number
  outroTotal: number
  transitionOverlap: number
}

/**
 * Assemble a complete TimingConfig from the 6 admin-editable values.
 * The 5 sequence totals are used to proportionally compute all 17 sub-timings.
 * transitionOverlap passes through unchanged.
 */
export function assembleFullTimingConfig(totals: TimingTotals): ResolvedTimingConfig {
  const introSubs = calculateSubTimings('intro', totals.introTotal)
  const bookSubs = calculateSubTimings('book', totals.bookTotal)
  const statsSubs = calculateSubTimings('stats', totals.statsTotal)
  const comingSoonSubs = calculateSubTimings('comingSoon', totals.comingSoonTotal)
  const outroSubs = calculateSubTimings('outro', totals.outroTotal)

  return {
    // Intro
    introFadeIn: introSubs.introFadeIn,
    introHold: introSubs.introHold,
    introFadeOut: introSubs.introFadeOut,
    introTotal: totals.introTotal,

    // Book
    bookSlideIn: bookSubs.bookSlideIn,
    bookTitleType: bookSubs.bookTitleType,
    bookRatingCount: bookSubs.bookRatingCount,
    bookHold: bookSubs.bookHold,
    bookExit: bookSubs.bookExit,
    bookTotal: totals.bookTotal,

    // Stats
    statsCountUp: statsSubs.statsCountUp,
    statsHold: statsSubs.statsHold,
    statsFadeOut: statsSubs.statsFadeOut,
    statsTotal: totals.statsTotal,

    // Coming Soon
    comingSoonFadeIn: comingSoonSubs.comingSoonFadeIn,
    comingSoonHold: comingSoonSubs.comingSoonHold,
    comingSoonFadeOut: comingSoonSubs.comingSoonFadeOut,
    comingSoonTotal: totals.comingSoonTotal,

    // Outro
    outroFadeIn: outroSubs.outroFadeIn,
    outroHold: outroSubs.outroHold,
    outroFadeOut: outroSubs.outroFadeOut,
    outroTotal: totals.outroTotal,

    // Transition
    transitionOverlap: totals.transitionOverlap,
  }
}
