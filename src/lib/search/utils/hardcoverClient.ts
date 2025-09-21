interface HardcoverBook {
  id?: string
  title?: string
  subtitle?: string
  authors?: Array<{ name: string }>
  description?: string
  release_date?: string
  pages?: number
  image?: string
  isbn?: string
  isbn13?: string
  categories?: Array<{ name: string }>
  [key: string]: unknown
}

interface HardcoverSearchResponse {
  data?: {
    search?: {
      results?: string // JSON string of results
      error?: string
    }
  }
  errors?: Array<{ message: string }>
}

export class HardcoverClient {
  private endpoint = 'https://api.hardcover.app/v1/graphql'
  private token = process.env.HARDCOVER_TOKEN

  async search(query: string, limit: number = 10): Promise<HardcoverBook[]> {
    if (!this.token) {
      console.error('HARDCOVER_TOKEN not configured')
      return []
    }

    try {
      const graphqlQuery = `
        query SearchBooks($query: String!) {
          search(query: $query) {
            results
            error
          }
        }
      `

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: { query }
        })
      })

      if (!response.ok) {
        console.error(`Hardcover API error: ${response.status}`)
        return []
      }

      const data: HardcoverSearchResponse = await response.json()

      if (data.errors && data.errors.length > 0) {
        console.error('Hardcover GraphQL errors:', data.errors)
        return []
      }

      if (data.data?.search?.error) {
        console.error('Hardcover search error:', data.data.search.error)
        return []
      }

      if (data.data?.search?.results) {
        try {
          // Parse the JSON string results
          const books = JSON.parse(data.data.search.results) as HardcoverBook[]
          return books.slice(0, limit)
        } catch (parseError) {
          console.error('Failed to parse Hardcover results:', parseError)
          return []
        }
      }

      return []
    } catch (error) {
      console.error('Hardcover client error:', error)
      return []
    }
  }
}