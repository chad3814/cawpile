import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { searchBooks } from "@/lib/googleBooks"

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth()
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // Get query parameter
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const limit = searchParams.get("limit")

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    )
  }

  try {
    const maxResults = limit ? parseInt(limit, 10) : 10
    const books = await searchBooks(query, maxResults)
    
    return NextResponse.json({ books })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 }
    )
  }
}