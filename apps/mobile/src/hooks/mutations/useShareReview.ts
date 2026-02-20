import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { bookKeys } from "@/lib/queryKeys";
import { enqueue } from "@/lib/offlineQueue";

/**
 * Input data for creating or updating a shared review.
 */
export interface ShareReviewInput {
  showDates: boolean;
  showBookClubs: boolean;
  showReadathons: boolean;
  showReview: boolean;
}

/**
 * Response from the share review endpoint.
 */
export interface ShareReviewResponse {
  id: string;
  shareToken: string;
  showDates: boolean;
  showBookClubs: boolean;
  showReadathons: boolean;
  showReview: boolean;
}

/**
 * Mutation hook for creating or updating a shared review.
 * Calls POST /api/user/books/[id]/share with privacy options.
 * Invalidates book detail cache on success.
 * Supports offline queueing.
 *
 * @param bookId - The userBook ID to share
 */
export function useShareReview(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation<ShareReviewResponse, ApiError, ShareReviewInput>({
    mutationFn: async (input: ShareReviewInput) => {
      const body: Record<string, unknown> = {
        showDates: input.showDates,
        showBookClubs: input.showBookClubs,
        showReadathons: input.showReadathons,
        showReview: input.showReview,
      };

      try {
        return await api.post<ShareReviewResponse>(
          `/api/user/books/${bookId}/share`,
          body,
        );
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("Network")) {
          await enqueue({
            type: "SHARE_REVIEW",
            method: "POST",
            url: `/api/user/books/${bookId}/share`,
            body,
            resourceId: bookId,
          });
          return {
            id: `pending-${Date.now()}`,
            shareToken: "pending",
            ...input,
          };
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
