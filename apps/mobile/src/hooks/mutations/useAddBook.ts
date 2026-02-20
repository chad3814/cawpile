import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { bookKeys } from "@/lib/queryKeys";
import { enqueue } from "@/lib/offlineQueue";
import type { BookStatus, BookFormat } from "@cawpile/shared";
import type { SignedBookSearchResult } from "@/hooks/queries/useBookSearch";

/**
 * Input data for adding a book to the library.
 */
export interface AddBookInput {
  signedResult: SignedBookSearchResult;
  status: BookStatus;
  format: BookFormat[];
  startDate?: string;
  finishDate?: string;
  dnfDate?: string;
  progress?: number;
  didFinish?: boolean;
  acquisitionMethod?: string | null;
  acquisitionOther?: string;
  bookClubName?: string | null;
  readathonName?: string | null;
  isReread?: boolean;
}

/**
 * Response from the add book endpoint.
 */
interface AddBookResponse {
  id: string;
  status: BookStatus;
}

/**
 * Mutation hook for adding a book to the user's library.
 * Calls POST /api/user/books with form data + signedResult.
 * On success: invalidate library query cache.
 * On offline: enqueue to offline action queue.
 */
export function useAddBook() {
  const queryClient = useQueryClient();

  return useMutation<AddBookResponse, ApiError, AddBookInput>({
    mutationFn: async (input: AddBookInput) => {
      // Determine actual status and finish date
      let actualStatus: BookStatus = input.status;
      let actualFinishDate = input.finishDate;

      if (input.status === "COMPLETED" && input.didFinish === false) {
        actualStatus = "DNF";
        actualFinishDate = input.dnfDate;
      }

      let progress = 0;
      if (actualStatus === "COMPLETED") {
        progress = 100;
      } else if (input.status === "READING" && input.progress) {
        progress = input.progress;
      }

      const body: Record<string, unknown> = {
        signedResult: input.signedResult,
        status: actualStatus,
        format: input.format,
        startDate: input.startDate,
        finishDate: actualFinishDate,
        progress,
        acquisitionMethod: input.acquisitionMethod,
        acquisitionOther: input.acquisitionOther,
        bookClubName: input.bookClubName,
        readathonName: input.readathonName,
        isReread: input.isReread,
      };

      try {
        return await api.post<AddBookResponse>("/api/user/books", body);
      } catch (error) {
        // If offline, enqueue the action
        if (error instanceof TypeError && error.message.includes("Network")) {
          await enqueue({
            type: "ADD_BOOK",
            method: "POST",
            url: "/api/user/books",
            body,
            resourceId: `new-${Date.now()}`,
          });
          return { id: `pending-${Date.now()}`, status: actualStatus };
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all library caches
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}
