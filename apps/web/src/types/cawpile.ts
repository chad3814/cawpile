// Re-export shared types and utilities
export type {
  CawpileFacet,
  CawpileRating,
  CawpileSemanticColor,
} from '@cawpile/shared';

export {
  FICTION_FACETS,
  NONFICTION_FACETS,
  RATING_SCALE_GUIDE,
  getFacetConfig,
  calculateCawpileAverage,
  convertToStars,
  getCawpileGrade,
} from '@cawpile/shared';

// Re-export the semantic color function under a different name for consumers that need it
export { getCawpileColor as getCawpileSemanticColor } from '@cawpile/shared';

// Web-only: BookType enum (for backward compatibility with existing code using BookType.FICTION)
// The shared package uses a string union type; this enum is compatible with it.
export enum BookType {
  FICTION = 'FICTION',
  NONFICTION = 'NONFICTION'
}

// Web-only: Star emoji rendering (differs on native platforms)
export function getStarEmojis(stars: number): string {
  return '\u2B50'.repeat(stars)
}

// Web-only: Tailwind CSS class-based color function
// This maintains backward compatibility with existing web app code.
// The shared package's getCawpileColor returns semantic color names ('green', 'yellow', etc.)
// but the web app expects Tailwind CSS classes.
export function getCawpileColor(value: number): string {
  if (value >= 8) return 'text-green-600 dark:text-green-400'
  if (value >= 6) return 'text-yellow-600 dark:text-yellow-400'
  if (value >= 4) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}
