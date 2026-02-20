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
 * Skips undefined values to match JSON.stringify behavior (JSON has no undefined)
 */
function stableStringify(obj: unknown): string {
  if (obj === null) {
    return "null"
  }

  if (obj === undefined) {
    // This shouldn't happen at top level, but handle it
    return "null"
  }

  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => stableStringify(item)).join(",") + "]"
  }

  if (typeof obj === "object") {
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort()
    const pairs: string[] = []
    for (const key of sortedKeys) {
      const value = (obj as Record<string, unknown>)[key]
      // Skip undefined values - they don't survive JSON round-trip
      if (value === undefined) {
        continue
      }
      pairs.push(JSON.stringify(key) + ":" + stableStringify(value))
    }
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

/**
 * Verify a signed search result's signature using HMAC-SHA256
 * Returns true if the signature is valid, false otherwise
 */
export function verifySignature(result: SignedBookSearchResult): boolean {
  if (!SEARCH_SIGNING_SECRET || SEARCH_SIGNING_SECRET.length < 32) {
    console.error("Signature verification failed: SEARCH_SIGNING_SECRET not configured or too short")
    return false
  }

  // Check if signature is present
  if (!result.signature) {
    console.error("Signature verification failed: No signature present")
    return false
  }

  try {
    // Create a copy without the signature for verification
    const { signature, ...payloadWithoutSignature } = result

    const dataToVerify = stableStringify(payloadWithoutSignature)
    const hmac = crypto.createHmac("sha256", SEARCH_SIGNING_SECRET)
    hmac.update(dataToVerify)
    const computedSignature = hmac.digest("hex")

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(computedSignature, "hex")
    )
  } catch (error) {
    console.error("Failed to verify search result signature:", error)
    return false
  }
}

/**
 * Verification result with type information for downstream consumption
 */
export interface VerifiedResult {
  isValid: boolean
  result: SignedBookSearchResult
  sources: SourceEntry[]
}

/**
 * Helper function to check if a result is verified and has valid sources
 * Returns a typed result for cleaner API consumption
 */
export function isVerifiedResult(result: SignedBookSearchResult): VerifiedResult {
  // Check signature presence and validity
  const hasValidSignature = verifySignature(result)

  // Check sources array exists and is non-empty
  const hasValidSources = Array.isArray(result.sources) && result.sources.length > 0

  return {
    isValid: hasValidSignature && hasValidSources,
    result,
    sources: hasValidSources ? result.sources : []
  }
}
