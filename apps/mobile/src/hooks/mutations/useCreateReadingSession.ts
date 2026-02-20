import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { sessionKeys, bookKeys } from "@/lib/queryKeys";
import { enqueue } from "@/lib/offlineQueue";

/**
 * Input data for creating a reading session.
 */
export interface CreateSessionInput {
  userBookId: string;
  startPage: number;
  endPage: number;
  duration?: number;
  notes?: string;
}

/**
 * Mutation hook for creating a reading session.
 * Calls POST /api/reading-sessions.
 * Invalidates sessions cache on success.
 * Supports offline queueing.
 */
export function useCreateReadingSession() {
  const queryClient = useQueryClient();

  return useMutation<Record<string, unknown>, ApiError, CreateSessionInput>({
    mutationFn: async (input: CreateSessionInput) => {
      const body: Record<string, unknown> = {
        userBookId: input.userBookId,
        startPage: input.startPage,
        endPage: input.endPage,
        duration: input.duration,
        notes: input.notes,
      };

      try {
        return await api.post<Record<string, unknown>>(
          "/api/reading-sessions",
          body,
        );
      } catch (error) {
        if (error instanceof TypeError && error.message.includes("Network")) {
          await enqueue({
            type: "CREATE_SESSION",
            method: "POST",
            url: "/api/reading-sessions",
            body,
            resourceId: `session-${input.userBookId}-${Date.now()}`,
          });
          return {};
        }
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: sessionKeys.forBook(variables.userBookId),
      });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(variables.userBookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}
