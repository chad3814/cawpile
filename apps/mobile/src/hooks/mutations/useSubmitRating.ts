import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { bookKeys } from "@/lib/queryKeys";
import { enqueue } from "@/lib/offlineQueue";
import type { CawpileRating } from "@cawpile/shared";

/**
 * Mutation hook for submitting a CAWPILE rating.
 * Calls PATCH /api/user/books/[id] with { cawpileRating }.
 * Invalidates book detail cache on success.
 * Supports offline queueing.
 *
 * @param bookId - The userBook ID to rate
 */
export function useSubmitRating(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation<Record<string, unknown>, ApiError, CawpileRating>({
    mutationFn: async (rating: CawpileRating) => {
      const body: Record<string, unknown> = {
        cawpileRating: rating,
      };

      try {
        return await api.patch<Record<string, unknown>>(
          `/api/user/books/${bookId}`,
          body,
        );
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("Network")) {
          await enqueue({
            type: "SUBMIT_RATING",
            method: "PATCH",
            url: `/api/user/books/${bookId}`,
            body,
            resourceId: bookId,
          });
          return {};
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}
