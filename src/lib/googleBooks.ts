import type { GoogleBooksResponse, BookSearchResult, GoogleBookResult } from "@/types/book"

const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"

export async function searchBooks(
  query: string, 
  maxResults: number = 10
): Promise<BookSearchResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      maxResults: maxResults.toString(),
      key: process.env.GOOGLE_BOOKS_API_KEY || "",
    })

    const response = await fetch(`${GOOGLE_BOOKS_API_URL}?${params}`)
    
    if (!response.ok) {
      console.error("Google Books API error:", response.status, await response.text())
      return []
    }

    const data: GoogleBooksResponse = await response.json()
    
    if (!data.items) {
      return []
    }

    return data.items.map(normalizeBookResult)
  } catch (error) {
    console.error("Error searching books:", error)
    return []
  }
}

export async function getBookById(googleBookId: string): Promise<BookSearchResult | null> {
  try {
    const params = new URLSearchParams({
      key: process.env.GOOGLE_BOOKS_API_KEY || "",
    })

    const response = await fetch(`${GOOGLE_BOOKS_API_URL}/${googleBookId}?${params}`)
    
    if (!response.ok) {
      console.error("Google Books API error:", response.status)
      return null
    }

    const data: GoogleBookResult = await response.json()
    return normalizeBookResult(data)
  } catch (error) {
    console.error("Error fetching book:", error)
    return null
  }
}

function normalizeBookResult(book: GoogleBookResult): BookSearchResult {
  const volumeInfo = book.volumeInfo
  
  // Extract ISBN numbers
  let isbn10: string | undefined
  let isbn13: string | undefined
  
  volumeInfo.industryIdentifiers?.forEach(identifier => {
    if (identifier.type === "ISBN_10") {
      isbn10 = identifier.identifier
    } else if (identifier.type === "ISBN_13") {
      isbn13 = identifier.identifier
    }
  })

  return {
    id: book.id,
    googleId: book.id,
    title: volumeInfo.title,
    subtitle: volumeInfo.subtitle,
    authors: volumeInfo.authors || [],
    description: volumeInfo.description,
    publishedDate: volumeInfo.publishedDate,
    pageCount: volumeInfo.pageCount,
    categories: volumeInfo.categories || [],
    imageUrl: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
    isbn10,
    isbn13,
  }
}