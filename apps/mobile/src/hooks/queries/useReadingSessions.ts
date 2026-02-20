import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { sessionKeys } from "@/lib/queryKeys";

/**
 * Represents a reading session from the API.
 */
export interface ReadingSession {
  id: string;
  userBookId: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  duration: number | null;
  notes: string | null;
  sessionDate: string;
  createdAt: string;
}

/**
 * Stats about reading sessions for a book.
 */
export interface ReadingSessionStats {
  totalSessions: number;
  totalPagesRead: number;
  totalMinutes: number;
}

/**
 * API response shape for reading sessions endpoint.
 */
interface ReadingSessionsResponse {
  sessions: ReadingSession[];
  total: number;
  stats: ReadingSessionStats;
}

/**
 * Query hook for fetching reading sessions for a specific book.
 * Calls GET /api/reading-sessions?userBookId=.
 *
 * @param userBookId - The userBook ID to fetch sessions for
 * @returns TanStack Query result with sessions, total count, and stats
 */
export function useReadingSessions(userBookId: string) {
  return useQuery<ReadingSessionsResponse>({
    queryKey: sessionKeys.forBook(userBookId),
    queryFn: async () => {
      return api.get<ReadingSessionsResponse>(
        `/api/reading-sessions?userBookId=${userBookId}`,
      );
    },
    enabled: !!userBookId,
  });
}
