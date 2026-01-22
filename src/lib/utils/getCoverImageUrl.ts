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
 * @param preferredProvider - Optional preferred provider ('hardcover' | 'google' | 'ibdb')
 * @returns The first non-null imageUrl found, or undefined if none available
 */
export function getCoverImageUrl(
  edition: EditionWithProviders,
  preferredProvider?: string | null
): string | undefined {
  // If a preferred provider is specified and has a valid image, use it
  if (preferredProvider) {
    let preferredImage: string | null | undefined

    switch (preferredProvider) {
      case 'hardcover':
        preferredImage = edition.hardcoverBook?.imageUrl
        break
      case 'google':
        preferredImage = edition.googleBook?.imageUrl
        break
      case 'ibdb':
        preferredImage = edition.ibdbBook?.imageUrl
        break
    }

    // Return preferred provider's image if it exists
    if (preferredImage) {
      return preferredImage
    }
  }

  // Default fallback priority: Hardcover > Google > IBDB
  const imageUrl =
    edition.hardcoverBook?.imageUrl ||
    edition.googleBook?.imageUrl ||
    edition.ibdbBook?.imageUrl ||
    undefined

  return imageUrl ?? undefined
}
