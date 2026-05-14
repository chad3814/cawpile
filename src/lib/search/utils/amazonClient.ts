/**
 * Amazon product client interface and implementations.
 *
 * RainforestClient is the initial backing implementation. The interface is
 * deliberately small (one method, one return shape) so that swapping to
 * PA-API, Keepa, or another provider is a class swap — no caller changes.
 */

export interface AmazonProduct {
  asin: string
  title: string
  authors: string[]
  description?: string
  publishedDate?: string
  pageCount?: number
  imageUrl?: string
  categories: string[]
  isbn10?: string
  isbn13?: string
  publisher?: string
}

export interface AmazonProductClient {
  getProductByAsin(asin: string): Promise<AmazonProduct | null>
}

interface RainforestAuthor {
  name?: string
}

interface RainforestCategory {
  name?: string
}

interface RainforestProduct {
  asin?: string
  title?: string
  authors?: RainforestAuthor[]
  description?: string
  publication_date?: string
  first_available?: { raw?: string }
  main_image?: { link?: string }
  categories?: RainforestCategory[]
  isbn?: string
  isbn_13?: string
  publisher?: string
  book_description?: { pages?: number }
}

interface RainforestResponse {
  product?: RainforestProduct
}

const RAINFOREST_ENDPOINT = 'https://api.rainforestapi.com/request'
const RAINFOREST_TIMEOUT_MS = 5000

export class RainforestClient implements AmazonProductClient {
  private apiKey = process.env.RAINFOREST_API_KEY

  async getProductByAsin(asin: string): Promise<AmazonProduct | null> {
    if (!this.apiKey) {
      console.error('RAINFOREST_API_KEY not configured')
      return null
    }

    const url =
      `${RAINFOREST_ENDPOINT}?api_key=${encodeURIComponent(this.apiKey)}` +
      `&type=product&amazon_domain=amazon.com&asin=${encodeURIComponent(asin)}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), RAINFOREST_TIMEOUT_MS)

    try {
      const response = await fetch(url, { signal: controller.signal })

      if (!response.ok) {
        console.error(`Rainforest API error: ${response.status}`)
        return null
      }

      const data = (await response.json()) as RainforestResponse

      if (!data.product) {
        return null
      }

      return mapRainforestProduct(data.product)
    } catch (error) {
      console.error('Rainforest client error:', error)
      return null
    } finally {
      clearTimeout(timeout)
    }
  }
}

function mapRainforestProduct(p: RainforestProduct): AmazonProduct | null {
  if (!p.asin || !p.title) {
    return null
  }

  return {
    asin: p.asin,
    title: p.title,
    authors: (p.authors ?? []).map(a => a.name).filter((n): n is string => Boolean(n)),
    description: p.description,
    publishedDate: p.publication_date ?? p.first_available?.raw,
    pageCount: p.book_description?.pages,
    imageUrl: p.main_image?.link,
    categories: (p.categories ?? []).map(c => c.name).filter((n): n is string => Boolean(n)),
    isbn10: p.isbn,
    isbn13: p.isbn_13,
    publisher: p.publisher,
  }
}
