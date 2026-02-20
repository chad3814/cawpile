import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bookKeys } from "@/lib/queryKeys";
import type { DashboardBookData } from "@cawpile/shared";

/**
 * Query hook for fetching book details.
 * Uses library cache data (no separate endpoint needed).
 * Data is already in DashboardBookData from the library query.
 *
 * @param id - The userBook ID
 * @returns TanStack Query result with DashboardBookData or undefined
 */
export function useBookDetails(id: string) {
  const queryClient = useQueryClient();

  return useQuery<DashboardBookData | undefined>({
    queryKey: bookKeys.detail(id),
    queryFn: () => {
      // Look for the book in the library cache first
      const allListQueries = queryClient.getQueriesData<DashboardBookData[]>({
        queryKey: bookKeys.lists(),
      });

      for (const [, data] of allListQueries) {
        if (data) {
          const found = data.find((book) => book.id === id);
          if (found) return found;
        }
      }

      return undefined;
    },
    // Keep the data in cache even after navigating away
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
