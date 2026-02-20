import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { userKeys } from "@/lib/queryKeys";
import type { UserBookClub } from "@cawpile/shared";

/**
 * Query hook for fetching the user's book clubs for autocomplete.
 * Calls GET /api/user/book-clubs.
 */
export function useBookClubs() {
  return useQuery<UserBookClub[]>({
    queryKey: userKeys.bookClubs(),
    queryFn: async () => {
      return api.get<UserBookClub[]>("/api/user/book-clubs");
    },
  });
}
