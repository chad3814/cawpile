interface HardcoverDocument {
  id?: string
  title?: string
  description?: string
  author_names?: string[]
  release_date?: string
  pages?: number
  image?: {
    url?: string
  }
  isbns?: string[]
  genres?: string[]
}

interface HardcoverHit {
  document: HardcoverDocument
}

interface HardcoverSearchResults {
  hits?: HardcoverHit[]
  found?: number
}

interface HardcoverSearchResponse {
  data?: {
    search?: {
      results?: string | HardcoverSearchResults
      error?: string
    }
  }
  errors?: Array<{ message: string }>
}

export class HardcoverClient {
  private endpoint = 'https://api.hardcover.app/v1/graphql'
  private token = process.env.HARDCOVER_TOKEN

  async search(query: string, limit: number = 10): Promise<HardcoverDocument[]> {
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
          // Handle both JSON string and already-parsed object
          const results = data.data.search.results
          const parsed: HardcoverSearchResults = typeof results === 'string'
            ? JSON.parse(results)
            : results

          // Extract documents from hits array
          if (!parsed.hits || !Array.isArray(parsed.hits)) {
            console.error('Hardcover results missing hits array')
            return []
          }

          return parsed.hits.slice(0, limit).map(hit => hit.document)
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