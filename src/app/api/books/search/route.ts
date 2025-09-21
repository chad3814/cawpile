import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { SearchOrchestrator } from "@/lib/search/SearchOrchestrator"
import { LocalDatabaseProvider } from "@/lib/search/providers/LocalDatabaseProvider"
import { GoogleBooksProvider } from "@/lib/search/providers/GoogleBooksProvider"
import { IBDBProvider } from "@/lib/search/providers/IBDBProvider"
import { HardcoverProvider } from "@/lib/search/providers/HardcoverProvider"

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

    // Create and configure the search orchestrator
    const orchestrator = new SearchOrchestrator()

    // Register all providers in order of weight (highest to lowest)
    orchestrator.registerProvider(new LocalDatabaseProvider())    // weight: 10
    orchestrator.registerProvider(new HardcoverProvider())         // weight: 6
    orchestrator.registerProvider(new GoogleBooksProvider())       // weight: 5
    orchestrator.registerProvider(new IBDBProvider())              // weight: 4

    // Search across all providers
    const books = await orchestrator.search(query, maxResults)

    return NextResponse.json({ books })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 }
    )
  }
}
