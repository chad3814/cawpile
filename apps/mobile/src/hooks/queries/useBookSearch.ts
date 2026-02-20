import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { bookKeys } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/useDebounce";
import type { BookSearchResult } from "@cawpile/shared";

/**
 * Extended search result that includes source provenance and cryptographic signature.
 * Matches the web app's SignedBookSearchResult type from search/types.ts.
 */
export interface SourceEntry {
  provider: string;
  data: Record<string, unknown>;
}

export interface SignedBookSearchResult extends BookSearchResult {
  sources: SourceEntry[];
  signature?: string;
}

/**
 * API response shape for search endpoint.
 */
interface SearchApiResponse {
  books: SignedBookSearchResult[];
  taggedSearch: boolean;
  provider?: string;
  error?: string;
}

/**
 * Detects if query contains tagged search syntax at the start.
 */
function detectTaggedSearch(query: string): string | null {
  if (!query) return null;
  const tagPattern = /^(ibdb|hard|gbid|isbn):/i;
  const match = query.match(tagPattern);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Query hook for book search.
 * Calls GET /api/books/search?q= with 600ms debounce.
 * Returns search results and tagged search indicator.
 *
 * @param query - The raw search query string
 * @returns TanStack Query result with books and taggedSearch flag
 */
export function useBookSearch(query: string) {
  const debouncedQuery = useDebounce(query, 600);
  const taggedSearch = detectTaggedSearch(debouncedQuery);

  const result = useQuery<SearchApiResponse>({
    queryKey: bookKeys.search(debouncedQuery),
    queryFn: async () => {
      return api.get<SearchApiResponse>(
        `/api/books/search?q=${encodeURIComponent(debouncedQuery)}`,
      );
    },
    enabled: debouncedQuery.trim().length > 0,
  });

  return {
    ...result,
    books: result.data?.books ?? [],
    taggedSearch: result.data?.taggedSearch ?? taggedSearch !== null,
    taggedProvider: taggedSearch,
    debouncedQuery,
  };
}
