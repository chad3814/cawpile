import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { bookKeys } from "@/lib/queryKeys";
import { enqueue } from "@/lib/offlineQueue";

/**
 * Mutation hook for deleting a shared review.
 * Calls DELETE /api/user/books/[id]/share.
 * Invalidates book detail cache on success.
 * Supports offline queueing.
 *
 * @param bookId - The userBook ID whose share to delete
 */
export function useDeleteShare(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      try {
        await api.delete(`/api/user/books/${bookId}/share`);
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("Network")) {
          await enqueue({
            type: "DELETE_SHARE",
            method: "DELETE",
            url: `/api/user/books/${bookId}/share`,
            body: {},
            resourceId: `share-${bookId}`,
          });
          return;
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
