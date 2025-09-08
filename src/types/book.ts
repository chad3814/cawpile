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

export interface Book {
  id: string
  title: string
  authors: string[]
  language: string
  bookType: 'FICTION' | 'NONFICTION'
  createdAt: Date
  updatedAt: Date
}

export interface Edition {
  id: string
  bookId: string
  isbn10: string | null
  isbn13: string | null
  title: string | null
  authors: string[]
  format: string | null
  googleBooksId: string | null
  googleBook?: GoogleBook | null
  _count?: {
    userBooks: number
  }
}

export interface GoogleBook {
  id: string
  googleId: string
  editionId: string
  title: string
  subtitle: string | null
  authors: string[]
  description: string | null
  publishedDate: string | null
  pageCount: number | null
  imageUrl: string | null
  categories: string[]
}

export interface BookWithEditions extends Book {
  editions: Edition[]
  userCount?: number
}