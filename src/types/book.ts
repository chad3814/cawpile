export interface GoogleBookResult {
  id: string
  volumeInfo: {
    title: string
    subtitle?: string
    authors?: string[]
    description?: string
    publishedDate?: string
    pageCount?: number
    categories?: string[]
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    industryIdentifiers?: Array<{
      type: string
      identifier: string
    }>
  }
}

export interface BookSearchResult {
  id: string
  googleId: string
  title: string
  subtitle?: string
  authors: string[]
  description?: string
  publishedDate?: string
  pageCount?: number
  categories: string[]
  imageUrl?: string
  isbn10?: string
  isbn13?: string
}

export interface GoogleBooksResponse {
  items?: GoogleBookResult[]
  totalItems: number
}