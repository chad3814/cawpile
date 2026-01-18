import crypto from "crypto"
import type { SignedBookSearchResult, SourceEntry } from "../types"
import type { BookSearchResult } from "@/types/book"

// Validate environment variable for signing
const SEARCH_SIGNING_SECRET = process.env.SEARCH_SIGNING_SECRET

if (!SEARCH_SIGNING_SECRET) {
  console.warn("SEARCH_SIGNING_SECRET not configured. Search result signing will be disabled.")
} else if (SEARCH_SIGNING_SECRET.length < 32) {
  console.warn("SEARCH_SIGNING_SECRET is too short (minimum 32 characters). Search result signing may be insecure.")
}

/**
 * Deterministically stringify an object with sorted keys
 * Ensures the same input always produces the same string output
 */
function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return JSON.stringify(obj)
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => stableStringify(item)).join(",") + "]"
  }

  if (typeof obj === "object") {
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort()
    const pairs = sortedKeys.map((key) => {
      const value = (obj as Record<string, unknown>)[key]
      return JSON.stringify(key) + ":" + stableStringify(value)
    })
    return "{" + pairs.join(",") + "}"
  }

  return JSON.stringify(obj)
}

/**
 * Sign a single search result using HMAC-SHA256
 * Returns the hex-encoded signature, or undefined if signing fails
 */
export function signResult(result: BookSearchResult & { sources: SourceEntry[] }): string | undefined {
  if (!SEARCH_SIGNING_SECRET || SEARCH_SIGNING_SECRET.length < 32) {
    return undefined
  }

  try {
    const dataToSign = stableStringify(result)
    const hmac = crypto.createHmac("sha256", SEARCH_SIGNING_SECRET)
    hmac.update(dataToSign)
    return hmac.digest("hex")
  } catch (error) {
    console.error("Failed to sign search result:", error)
    return undefined
  }
}

/**
 * Sign multiple search results in batch
 * Adds signature field to each result
 */
export function signResults(
  results: (BookSearchResult & { sources: SourceEntry[] })[]
): SignedBookSearchResult[] {
  return results.map((result) => {
    const signature = signResult(result)
    return {
      ...result,
      signature,
    }
  })
}
