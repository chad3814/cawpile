/**
 * @jest-environment node
 */
import { calculateSubTimings, assembleFullTimingConfig } from '@/lib/video/timingCalculation'

describe('timingCalculation', () => {
  test('proportional sub-timing distribution from a sequence total', () => {
    // Default intro: fadeIn=15, hold=45, fadeOut=15, total=75
    // Ratios: 0.2, 0.6, 0.2
    // With introTotal=150: fadeIn=30, hold=90, fadeOut=30
    const result = calculateSubTimings('intro', 150)
    expect(result.introFadeIn).toBe(30)
    expect(result.introHold).toBe(90)
    expect(result.introFadeOut).toBe(30)

    // Sum must equal the total
    const sum = result.introFadeIn + result.introHold + result.introFadeOut
    expect(sum).toBe(150)
  })

  test('rounding correction ensures sub-timings sum exactly to the total', () => {
    // Use a total that forces rounding drift
    // Default intro ratios: 0.2, 0.6, 0.2
    // With total=7: raw = 1.4, 4.2, 1.4 -> rounded = 1, 4, 1 = 6 (drift = -1)
    // After correction: largest (hold=4) adjusted to 5 -> sum = 7
    const result = calculateSubTimings('intro', 7)
    const sum = result.introFadeIn + result.introHold + result.introFadeOut
    expect(sum).toBe(7)

    // Another case: book sequence with awkward total
    // Default book: slideIn=12, titleType=20, ratingCount=30, hold=60, exit=15, total=150
    // Ratios: 0.08, 0.1333, 0.2, 0.4, 0.1
    const bookResult = calculateSubTimings('book', 101)
    const bookSum =
      bookResult.bookSlideIn +
      bookResult.bookTitleType +
      bookResult.bookRatingCount +
      bookResult.bookHold +
      bookResult.bookExit
    expect(bookSum).toBe(101)
  })

  test('all five sequence types distribute correctly', () => {
    const sequences: Array<{
      key: 'intro' | 'book' | 'stats' | 'comingSoon' | 'outro'
      total: number
      subKeys: string[]
    }> = [
      { key: 'intro', total: 100, subKeys: ['introFadeIn', 'introHold', 'introFadeOut'] },
      { key: 'book', total: 200, subKeys: ['bookSlideIn', 'bookTitleType', 'bookRatingCount', 'bookHold', 'bookExit'] },
      { key: 'stats', total: 180, subKeys: ['statsCountUp', 'statsHold', 'statsFadeOut'] },
      { key: 'comingSoon', total: 120, subKeys: ['comingSoonFadeIn', 'comingSoonHold', 'comingSoonFadeOut'] },
      { key: 'outro', total: 60, subKeys: ['outroFadeIn', 'outroHold', 'outroFadeOut'] },
    ]

    for (const { key, total, subKeys } of sequences) {
      const result = calculateSubTimings(key, total)

      // All sub-keys should be present
      for (const subKey of subKeys) {
        expect(result[subKey]).toBeDefined()
        expect(typeof result[subKey]).toBe('number')
        expect(Number.isInteger(result[subKey])).toBe(true)
      }

      // Sum of sub-timings should equal the total
      const sum = subKeys.reduce((acc, subKey) => acc + result[subKey], 0)
      expect(sum).toBe(total)
    }
  })

  test('transitionOverlap passes through unchanged in assembleFullTimingConfig', () => {
    const totals = {
      introTotal: 75,
      bookTotal: 150,
      statsTotal: 120,
      comingSoonTotal: 90,
      outroTotal: 90,
      transitionOverlap: 42,
    }

    const result = assembleFullTimingConfig(totals)

    // transitionOverlap should pass through exactly as provided
    expect(result.transitionOverlap).toBe(42)

    // Also verify the totals are set correctly
    expect(result.introTotal).toBe(75)
    expect(result.bookTotal).toBe(150)
    expect(result.statsTotal).toBe(120)
    expect(result.comingSoonTotal).toBe(90)
    expect(result.outroTotal).toBe(90)

    // Verify all 23 timing properties exist
    const keys = Object.keys(result)
    expect(keys).toHaveLength(23)
  })
})
