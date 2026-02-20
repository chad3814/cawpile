import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { bookKeys } from "@/lib/queryKeys";
import { enqueue } from "@/lib/offlineQueue";
import type { DashboardBookData } from "@cawpile/shared";

/**
 * Context saved during optimistic update for rollback on error.
 */
interface DeleteBookContext {
  previousBooks: DashboardBookData[] | undefined;
}

/**
 * Mutation hook for deleting a book from the user's library.
 * Calls DELETE /api/user/books/[id] with optimistic cache removal.
 * Supports offline queueing.
 */
export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string, DeleteBookContext>({
    mutationFn: async (bookId: string) => {
      try {
        await api.delete(`/api/user/books/${bookId}`);
      } catch (error) {
        // If offline, enqueue the action
        if (error instanceof TypeError && error.message.includes("Network")) {
          await enqueue({
            type: "DELETE_BOOK",
            method: "DELETE",
            url: `/api/user/books/${bookId}`,
            body: {},
            resourceId: bookId,
          });
          return;
        }
        throw error;
      }
    },
    onMutate: async (bookId: string): Promise<DeleteBookContext> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: bookKeys.all });

      // Snapshot previous value
      const previousBooks = queryClient.getQueryData<DashboardBookData[]>(bookKeys.lists());

      // Optimistically remove the book from all list caches
      queryClient.setQueriesData<DashboardBookData[]>(
        { queryKey: bookKeys.lists() },
        (old) => old?.filter((book) => book.id !== bookId),
      );

      return { previousBooks };
    },
    onError: (_error, _bookId, context) => {
      // Rollback on error
      if (context?.previousBooks) {
        queryClient.setQueryData(bookKeys.lists(), context.previousBooks);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}
