import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { userKeys } from "@/lib/queryKeys";
import type { UserReadathon } from "@cawpile/shared";

/**
 * Query hook for fetching the user's readathons for autocomplete.
 * Calls GET /api/user/readathons.
 */
export function useReadathons() {
  return useQuery<UserReadathon[]>({
    queryKey: userKeys.readathons(),
    queryFn: async () => {
      return api.get<UserReadathon[]>("/api/user/readathons");
    },
  });
}
