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
  publishedDate?: string
  pageCount?: number
  imageUrl?: string
  categories?: unknown[]
  [key: string]: unknown
}

interface IbdbResponse {
  status: 'ok' | 'error'
  books?: IbdbRawBook[]
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
    description: raw.description,
    publishedDate: raw.publishedDate,
    pageCount: raw.pageCount,
    imageUrl: raw.imageUrl,
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

      const data: IbdbResponse = await response.json()

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

      const data: IbdbRawBook = await response.json()
      return normalizeBook(data)
    } catch (error) {
      console.error('IBDB client error:', error)
      return null
    }
  }
}
