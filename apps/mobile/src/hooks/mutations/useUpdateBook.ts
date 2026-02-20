import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { bookKeys } from "@/lib/queryKeys";
import { enqueue } from "@/lib/offlineQueue";
import type { BookStatus, BookFormat, DashboardBookData } from "@cawpile/shared";

/**
 * Input data for updating a book.
 * All fields are optional -- only changed fields should be included.
 */
export interface UpdateBookInput {
  status?: BookStatus;
  format?: BookFormat[];
  startDate?: string | null;
  finishDate?: string | null;
  progress?: number;
  currentPage?: number;
  review?: string | null;
  acquisitionMethod?: string | null;
  acquisitionOther?: string | null;
  bookClubName?: string | null;
  readathonName?: string | null;
  isReread?: boolean;
  dnfReason?: string | null;
  lgbtqRepresentation?: string | null;
  lgbtqDetails?: string | null;
  disabilityRepresentation?: string | null;
  disabilityDetails?: string | null;
  isNewAuthor?: boolean;
  authorPoc?: string | null;
  authorPocDetails?: string | null;
}

/**
 * Context saved during optimistic update for rollback on error.
 */
interface UpdateBookContext {
  previousBooks: DashboardBookData[] | undefined;
}

/**
 * Build a type-safe partial update for DashboardBookData from UpdateBookInput.
 * Converts string dates to Date objects for cache compatibility.
 */
function buildOptimisticUpdate(input: UpdateBookInput): Partial<DashboardBookData> {
  const update: Partial<DashboardBookData> = {};

  if (input.status !== undefined) update.status = input.status;
  if (input.format !== undefined) update.format = input.format;
  if (input.startDate !== undefined) {
    update.startDate = input.startDate ? new Date(input.startDate) : null;
  }
  if (input.finishDate !== undefined) {
    update.finishDate = input.finishDate ? new Date(input.finishDate) : null;
  }
  if (input.progress !== undefined) update.progress = input.progress;
  if (input.review !== undefined) update.review = input.review;
  if (input.acquisitionMethod !== undefined) update.acquisitionMethod = input.acquisitionMethod;
  if (input.bookClubName !== undefined) update.bookClubName = input.bookClubName;
  if (input.readathonName !== undefined) update.readathonName = input.readathonName;
  if (input.isReread !== undefined) update.isReread = input.isReread;
  if (input.dnfReason !== undefined) update.dnfReason = input.dnfReason;
  if (input.lgbtqRepresentation !== undefined) update.lgbtqRepresentation = input.lgbtqRepresentation;
  if (input.disabilityRepresentation !== undefined) update.disabilityRepresentation = input.disabilityRepresentation;
  if (input.isNewAuthor !== undefined) update.isNewAuthor = input.isNewAuthor;
  if (input.authorPoc !== undefined) update.authorPoc = input.authorPoc;

  return update;
}

/**
 * Mutation hook for updating a book in the user's library.
 * Calls PATCH /api/user/books/[id] with partial update payload.
 * Optimistic cache update for book details and library list.
 * Supports offline queueing.
 *
 * @param bookId - The userBook ID to update
 */
export function useUpdateBook(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation<Record<string, unknown>, ApiError, UpdateBookInput, UpdateBookContext>({
    mutationFn: async (input: UpdateBookInput) => {
      const body: Record<string, unknown> = {};

      // Only include fields that are explicitly set
      if (input.status !== undefined) body.status = input.status;
      if (input.format !== undefined) body.format = input.format;
      if (input.startDate !== undefined) body.startDate = input.startDate;
      if (input.finishDate !== undefined) body.finishDate = input.finishDate;
      if (input.progress !== undefined) body.progress = input.progress;
      if (input.currentPage !== undefined) body.currentPage = input.currentPage;
      if (input.review !== undefined) body.review = input.review;
      if (input.acquisitionMethod !== undefined) body.acquisitionMethod = input.acquisitionMethod;
      if (input.acquisitionOther !== undefined) body.acquisitionOther = input.acquisitionOther;
      if (input.bookClubName !== undefined) body.bookClubName = input.bookClubName;
      if (input.readathonName !== undefined) body.readathonName = input.readathonName;
      if (input.isReread !== undefined) body.isReread = input.isReread;
      if (input.dnfReason !== undefined) body.dnfReason = input.dnfReason;
      if (input.lgbtqRepresentation !== undefined) body.lgbtqRepresentation = input.lgbtqRepresentation;
      if (input.lgbtqDetails !== undefined) body.lgbtqDetails = input.lgbtqDetails;
      if (input.disabilityRepresentation !== undefined) body.disabilityRepresentation = input.disabilityRepresentation;
      if (input.disabilityDetails !== undefined) body.disabilityDetails = input.disabilityDetails;
      if (input.isNewAuthor !== undefined) body.isNewAuthor = input.isNewAuthor;
      if (input.authorPoc !== undefined) body.authorPoc = input.authorPoc;
      if (input.authorPocDetails !== undefined) body.authorPocDetails = input.authorPocDetails;

      try {
        return await api.patch<Record<string, unknown>>(
          `/api/user/books/${bookId}`,
          body,
        );
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("Network")) {
          await enqueue({
            type: "UPDATE_BOOK",
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
    onMutate: async (input: UpdateBookInput): Promise<UpdateBookContext> => {
      await queryClient.cancelQueries({ queryKey: bookKeys.all });

      const previousBooks = queryClient.getQueryData<DashboardBookData[]>(bookKeys.lists());

      // Build a type-safe partial update
      const optimisticUpdate = buildOptimisticUpdate(input);

      // Optimistically update the book in all list caches
      queryClient.setQueriesData<DashboardBookData[]>(
        { queryKey: bookKeys.lists() },
        (old) =>
          old?.map((book) =>
            book.id === bookId
              ? { ...book, ...optimisticUpdate }
              : book,
          ),
      );

      return { previousBooks };
    },
    onError: (_error, _input, context) => {
      if (context?.previousBooks) {
        queryClient.setQueryData(bookKeys.lists(), context.previousBooks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}
