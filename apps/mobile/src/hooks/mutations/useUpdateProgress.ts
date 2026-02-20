import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { bookKeys } from "@/lib/queryKeys";
import { enqueue } from "@/lib/offlineQueue";
import type { DashboardBookData } from "@cawpile/shared";

/**
 * Input data for updating book progress.
 */
export interface UpdateProgressInput {
  progress: number;
  currentPage?: number;
}

/**
 * Mutation hook for updating reading progress.
 * Calls PATCH /api/user/books/[id] with { progress, currentPage }.
 * Optimistic cache update.
 * Supports offline queueing.
 *
 * @param bookId - The userBook ID to update
 */
export function useUpdateProgress(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation<Record<string, unknown>, ApiError, UpdateProgressInput>({
    mutationFn: async (input: UpdateProgressInput) => {
      const body: Record<string, unknown> = {
        progress: input.progress,
        currentPage: input.currentPage,
      };

      try {
        return await api.patch<Record<string, unknown>>(
          `/api/user/books/${bookId}`,
          body,
        );
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("Network")) {
          await enqueue({
            type: "UPDATE_PROGRESS",
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
    onMutate: async (input: UpdateProgressInput) => {
      await queryClient.cancelQueries({ queryKey: bookKeys.detail(bookId) });

      // Optimistically update the book in all list caches
      queryClient.setQueriesData<DashboardBookData[]>(
        { queryKey: bookKeys.lists() },
        (old) =>
          old?.map((book) =>
            book.id === bookId
              ? { ...book, progress: input.progress }
              : book,
          ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}
