/**
 * Tag parser utility for tagged search syntax
 * Parses search input for tagged search prefixes: ibdb:, hard:, gbid:, isbn:
 */

/**
 * Supported tag types for tagged search
 */
export type TagType = 'ibdb' | 'hard' | 'gbid' | 'isbn'

/**
 * Result of parsing a tagged search query
 */
export interface TaggedSearchResult {
  tag: TagType
  value: string
}

/**
 * Parses a search query for tagged search syntax
 * Tags must be at the start of the query string and are case-insensitive
 *
 * @param query - The search query to parse
 * @returns The parsed tag and value, or null if no tag detected
 *
 * @example
 * parseTaggedSearch('ibdb:uuid-here') // { tag: 'ibdb', value: 'uuid-here' }
 * parseTaggedSearch('HARD:12345') // { tag: 'hard', value: '12345' }
 * parseTaggedSearch('lord of the rings') // null
 */
export function parseTaggedSearch(query: string): TaggedSearchResult | null {
  if (!query) {
    return null
  }

  // Match tags at the start of the query string only
  // Pattern: ^(tag):(.+)$ where tag is case-insensitive
  const tagPattern = /^(ibdb|hard|gbid|isbn):(.+)$/i

  const match = query.match(tagPattern)

  if (!match) {
    return null
  }

  const tag = match[1].toLowerCase() as TagType
  const value = match[2]

  return { tag, value }
}
