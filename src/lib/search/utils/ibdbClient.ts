interface IbdbBook {
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

interface IbdbResponse {
  status: 'ok' | 'error'
  books?: IbdbBook[]
  message?: string
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

      return data.books || []
    } catch (error) {
      console.error('IBDB client error:', error)
      return []
    }
  }
}
