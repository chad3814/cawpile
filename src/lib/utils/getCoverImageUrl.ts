/**
 * Utility function to get cover image URL with multi-provider fallback
 * Priority order: User preference → Edition default → Hardcover > Google > IBDB
 */

export interface ProviderImageData {
  imageUrl: string | null
}

export interface EditionWithProviders {
  defaultCoverProvider?: string | null
  hardcoverBook?: ProviderImageData | null
  googleBook?: ProviderImageData | null
  ibdbBook?: ProviderImageData | null
}

function getImageForProvider(
  edition: EditionWithProviders,
  provider: string
): string | undefined {
  switch (provider) {
    case 'hardcover':
      return edition.hardcoverBook?.imageUrl ?? undefined
    case 'google':
      return edition.googleBook?.imageUrl ?? undefined
    case 'ibdb':
      return edition.ibdbBook?.imageUrl ?? undefined
    default:
      return undefined
  }
}

/**
 * Get the cover image URL from an edition, using fallback logic
 * across multiple providers:
 * User preferredCoverProvider → Edition defaultCoverProvider → Hardcover > Google > IBDB
 *
 * @param edition - Edition object with provider relations
 * @param preferredProvider - Optional user-level preferred provider ('hardcover' | 'google' | 'ibdb')
 * @returns The first non-null imageUrl found, or undefined if none available
 */
export function getCoverImageUrl(
  edition: EditionWithProviders,
  preferredProvider?: string | null
): string | undefined {
  // 1. User-level preferred provider
  if (preferredProvider) {
    const preferredImage = getImageForProvider(edition, preferredProvider)
    if (preferredImage) {
      return preferredImage
    }
  }

  // 2. Edition-level default provider
  if (edition.defaultCoverProvider) {
    const defaultImage = getImageForProvider(edition, edition.defaultCoverProvider)
    if (defaultImage) {
      return defaultImage
    }
  }

  // 3. Default fallback priority: Hardcover > Google > IBDB
  return (
    edition.hardcoverBook?.imageUrl ||
    edition.googleBook?.imageUrl ||
    edition.ibdbBook?.imageUrl ||
    undefined
  )
}
