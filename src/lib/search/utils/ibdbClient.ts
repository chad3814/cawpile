export interface IbdbBook {
  id?: string
  title?: string
  authors?: string[]
  isbn10?: string
  isbn13?: string
  description?: string
  publishedDate?: string
  pageCount?: number
  imageUrl?: string
  categories?: string[]
  [key: string]: unknown
}

interface IbdbRawBook {
  id?: string
  title?: string
  authors?: unknown[]
  isbn10?: string
  isbn13?: string
  description?: string
  synopsis?: string  // API returns synopsis, not description
  publishedDate?: string
  publicationDate?: string  // API returns publicationDate, not publishedDate
  pageCount?: number
  imageUrl?: string
  image?: { url?: string }  // API returns image object, not imageUrl
  categories?: unknown[]
  [key: string]: unknown
}

interface IbdbSearchResponse {
  status: 'ok' | 'error'
  books?: IbdbRawBook[]
  message?: string
}

interface IbdbBookResponse {
  status: 'ok' | 'error'
  book?: IbdbRawBook
  message?: string
}

function normalizeStringArray(items: unknown[] | undefined): string[] {
  if (!items || !Array.isArray(items)) return []

  return items.map(item => {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object' && 'name' in item) {
      return String((item as { name: unknown }).name)
    }
    return ''
  }).filter(Boolean)
}

function normalizeBook(raw: IbdbRawBook): IbdbBook {
  return {
    id: raw.id,
    title: raw.title,
    authors: normalizeStringArray(raw.authors),
    isbn10: raw.isbn10,
    isbn13: raw.isbn13,
    // API returns synopsis, not description
    description: raw.description || raw.synopsis,
    // API returns publicationDate, not publishedDate
    publishedDate: raw.publishedDate || raw.publicationDate,
    pageCount: raw.pageCount,
    // API returns image object, not imageUrl
    imageUrl: raw.imageUrl || raw.image?.url,
    categories: normalizeStringArray(raw.categories),
  }
}

export class IbdbClient {
  private baseUrl = 'https://ibdb.dev'

  async search(query: string): Promise<IbdbBook[]> {
    try {
      const url = new URL('/api/search', this.baseUrl)
      url.searchParams.append('q', query)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`IBDB API error: ${response.status}`)
        return []
      }

      const data: IbdbSearchResponse = await response.json()

      if (data.status === 'error') {
        console.error('IBDB search error:', data.message)
        return []
      }

      return (data.books || []).map(normalizeBook)
    } catch (error) {
      console.error('IBDB client error:', error)
      return []
    }
  }

  /**
   * Fetches a single book by its UUID from the IBDb API
   *
   * @param uuid - The IBDb book UUID
   * @returns The normalized book data or null if not found/error
   */
  async getBookById(uuid: string): Promise<IbdbBook | null> {
    if (!uuid) {
      return null
    }

    try {
      const url = `${this.baseUrl}/api/book-json/${uuid}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`IBDB API error: ${response.status}`)
        return null
      }

      const data: IbdbBookResponse = await response.json()

      if (data.status !== 'ok' || !data.book) {
        console.error('IBDB book not found or error:', data.message)
        return null
      }

      return normalizeBook(data.book)
    } catch (error) {
      console.error('IBDB client error:', error)
      return null
    }
  }
}
