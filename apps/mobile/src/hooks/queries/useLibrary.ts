import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { bookKeys } from "@/lib/queryKeys";
import type { BookStatus, DashboardBookData } from "@cawpile/shared";

/**
 * Query hook for fetching the user's book library.
 * Calls GET /api/user/books with an optional ?status= filter.
 *
 * @param status - Optional status filter (WANT_TO_READ, READING, COMPLETED, DNF)
 * @returns TanStack Query result with DashboardBookData[]
 */
interface LibraryResponse {
  books: DashboardBookData[];
  stats: Record<string, number>;
  total: number;
}

export function useLibrary(status?: BookStatus) {
  return useQuery<DashboardBookData[]>({
    queryKey: bookKeys.list(status),
    queryFn: async () => {
      const path = status
        ? `/api/user/books?status=${status}`
        : "/api/user/books";
      const response = await api.get<LibraryResponse>(path);
      return response.books;
    },
  });
}
