import { inspect } from "node:util"

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity percentage between two strings
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()

  if (s1 === s2) return 100
  if (!s1.length || !s2.length) return 0

  const distance = levenshteinDistance(s1, s2)
  const maxLength = Math.max(s1.length, s2.length)
  const similarity = ((maxLength - distance) / maxLength) * 100

  return Math.round(similarity)
}

/**
 * Normalize author name for comparison (handle "John Smith" vs "Smith, John")
 */
function normalizeAuthorName(name: string | { name?: string }): string {
  // Handle author objects with a 'name' property
  if (typeof name === 'object' && name !== null) {
    if ('name' in name && typeof name.name === 'string') {
      return normalizeAuthorName(name.name)
    }
    console.error(`normalizeAuthorName bad author object "${inspect(name)}" - missing name property`);
    return ''
  }

  if (!name || typeof name !== 'string') {
    console.error(`normalizeAuthorName bad name "${inspect(name)}" ${typeof name}`);
    return ''
  }

  const normalized = name.toLowerCase().trim()

  // Handle "Last, First" format
  if (normalized.includes(',')) {
    const parts = normalized.split(',').map(p => p.trim())
    if (parts.length === 2) {
      return `${parts[1]} ${parts[0]}` // Convert to "First Last"
    }
  }

  return normalized
}

/**
 * Check if two author arrays match with fuzzy matching
 * @param threshold Minimum similarity percentage (default 80%)
 */
export function fuzzyMatchAuthors(
  authors1: (string | { name?: string })[],
  authors2: (string | { name?: string })[],
  threshold: number = 80
): boolean {
  if (!authors1.length || !authors2.length) return false

  // Check if at least one author from each list matches
  for (const author1 of authors1) {
    const normalized1 = normalizeAuthorName(author1)
    if (!normalized1) continue // Skip invalid authors

    for (const author2 of authors2) {
      const normalized2 = normalizeAuthorName(author2)
      if (!normalized2) continue // Skip invalid authors

      if (calculateSimilarity(normalized1, normalized2) >= threshold) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if two titles match with fuzzy matching
 * @param threshold Minimum similarity percentage (default 85%)
 */
export function fuzzyMatchTitle(title1: string, title2: string, threshold: number = 85): boolean {
  const similarity = calculateSimilarity(title1, title2)
  return similarity >= threshold
}
