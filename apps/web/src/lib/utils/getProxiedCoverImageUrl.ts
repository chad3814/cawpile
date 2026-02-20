/**
 * Utility to get a proxied cover image URL for use in image generation contexts.
 * Wraps getCoverImageUrl and returns a proxied URL when needed (e.g., for html2canvas).
 */
import { getCoverImageUrl, EditionWithProviders } from './getCoverImageUrl'

/**
 * Get a cover image URL that is optionally proxied through our image proxy.
 * The proxy is necessary for html2canvas scenarios where CORS restrictions
 * would otherwise prevent the image from being rendered.
 *
 * @param edition - Edition object with provider relations
 * @param preferredProvider - Optional preferred provider ('hardcover' | 'google' | 'ibdb')
 * @param shouldProxy - Whether to wrap the URL in a proxy call (defaults to false)
 * @returns The cover image URL, optionally proxied, or undefined if no cover available
 */
export function getProxiedCoverImageUrl(
  edition: EditionWithProviders,
  preferredProvider?: string | null,
  shouldProxy: boolean = false
): string | undefined {
  const imageUrl = getCoverImageUrl(edition, preferredProvider)

  if (!imageUrl) {
    return undefined
  }

  if (shouldProxy) {
    return `/api/proxy/image?url=${encodeURIComponent(imageUrl)}`
  }

  return imageUrl
}
