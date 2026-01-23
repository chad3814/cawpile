import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { SearchOrchestrator } from "@/lib/search/SearchOrchestrator"
import { LocalDatabaseProvider } from "@/lib/search/providers/LocalDatabaseProvider"
import { GoogleBooksProvider } from "@/lib/search/providers/GoogleBooksProvider"
import { IbdbProvider } from "@/lib/search/providers/IbdbProvider"
import { HardcoverProvider } from "@/lib/search/providers/HardcoverProvider"
import { parseTaggedSearch } from "@/lib/search/utils/tagParser"
import { handleTaggedSearch } from "@/lib/search/handlers/taggedSearchHandler"

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

    // Check for tagged search syntax before orchestrator invocation
    const taggedSearch = parseTaggedSearch(query)

    if (taggedSearch) {
      // Handle tagged search directly
      const result = await handleTaggedSearch(taggedSearch.tag, taggedSearch.value)
      return NextResponse.json(result)
    }

    // Standard search: use orchestrator
    const orchestrator = new SearchOrchestrator()

    // Register all providers in order of weight (highest to lowest)
    orchestrator.registerProvider(new LocalDatabaseProvider())    // weight: 10
    orchestrator.registerProvider(new HardcoverProvider())         // weight: 6
    orchestrator.registerProvider(new GoogleBooksProvider())       // weight: 5
    orchestrator.registerProvider(new IbdbProvider())              // weight: 4

    // Search across all providers
    const books = await orchestrator.search(query, maxResults)

    return NextResponse.json({ books, taggedSearch: false })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 }
    )
  }
}
