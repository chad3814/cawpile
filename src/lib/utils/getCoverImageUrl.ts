/**
 * Utility function to get cover image URL with multi-provider fallback
 * Priority order: Hardcover > Google > IBDB
 */

export interface ProviderImageData {
  imageUrl: string | null
}

export interface EditionWithProviders {
  hardcoverBook?: ProviderImageData | null
  googleBook?: ProviderImageData | null
  ibdbBook?: ProviderImageData | null
}

/**
 * Get the cover image URL from an edition, using fallback logic
 * across multiple providers: Hardcover > Google > IBDB
 *
 * @param edition - Edition object with provider relations
 * @returns The first non-null imageUrl found, or undefined if none available
 */
export function getCoverImageUrl(edition: EditionWithProviders): string | undefined {
  // Priority: Hardcover > Google > IBDB
  const imageUrl =
    edition.hardcoverBook?.imageUrl ||
    edition.googleBook?.imageUrl ||
    edition.ibdbBook?.imageUrl ||
    undefined

  return imageUrl ?? undefined
}
