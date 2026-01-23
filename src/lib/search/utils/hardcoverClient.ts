export interface HardcoverDocument {
  id?: number | string
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

interface HardcoverBookByPkResponse {
  data?: {
    books_by_pk?: HardcoverDocument | null
  }
  errors?: Array<{ message: string }>
}

interface HardcoverBooksByIsbnResponse {
  data?: {
    books?: HardcoverDocument[]
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

  /**
   * Fetches a single book by its ID from the Hardcover GraphQL API
   *
   * @param id - The Hardcover book ID (numeric)
   * @returns The book document or null if not found/error
   */
  async getBookById(id: number): Promise<HardcoverDocument | null> {
    if (!id || id <= 0) {
      return null
    }

    if (!this.token) {
      console.error('HARDCOVER_TOKEN not configured')
      return null
    }

    try {
      const graphqlQuery = `
        query GetBookById($id: Int!) {
          books_by_pk(id: $id) {
            id
            title
            description
            author_names
            release_date
            pages
            image
            isbns
            genres
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
          variables: { id }
        })
      })

      if (!response.ok) {
        console.error(`Hardcover API error: ${response.status}`)
        return null
      }

      const data: HardcoverBookByPkResponse = await response.json()

      if (data.errors && data.errors.length > 0) {
        console.error('Hardcover GraphQL errors:', data.errors)
        return null
      }

      return data.data?.books_by_pk || null
    } catch (error) {
      console.error('Hardcover client error:', error)
      return null
    }
  }

  /**
   * Fetches a book by its ISBN from the Hardcover GraphQL API
   *
   * @param isbn - The ISBN (10 or 13 digits)
   * @returns The book document or null if not found/error
   */
  async getBookByIsbn(isbn: string): Promise<HardcoverDocument | null> {
    if (!isbn) {
      return null
    }

    if (!this.token) {
      console.error('HARDCOVER_TOKEN not configured')
      return null
    }

    // Strip hyphens
    const cleanIsbn = isbn.replace(/-/g, '')

    try {
      // Use isbn_13 or isbn_10 based on length
      const isbnField = cleanIsbn.length === 13 ? 'isbn_13' : 'isbn_10'

      const graphqlQuery = `
        query GetBookByIsbn($isbn: String!) {
          books(where: {editions: {${isbnField}: {_eq: $isbn}}}) {
            id
            title
            description
            author_names
            release_date
            pages
            image
            isbns
            genres
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
          variables: { isbn: cleanIsbn }
        })
      })

      if (!response.ok) {
        console.error(`Hardcover API error: ${response.status}`)
        return null
      }

      const data: HardcoverBooksByIsbnResponse = await response.json()

      if (data.errors && data.errors.length > 0) {
        console.error('Hardcover GraphQL errors:', data.errors)
        return null
      }

      // Return the first matching book or null
      return data.data?.books?.[0] || null
    } catch (error) {
      console.error('Hardcover client error:', error)
      return null
    }
  }
}
