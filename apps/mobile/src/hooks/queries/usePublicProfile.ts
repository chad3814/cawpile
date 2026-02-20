import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { profileKeys } from "@/lib/queryKeys";
import type { ProfilePageData } from "@cawpile/shared";

/**
 * Query hook for fetching a public profile by username.
 * Calls GET /api/profile/[username].
 *
 * @param username - The username to fetch the profile for
 * @returns TanStack Query result with ProfilePageData
 */
export function usePublicProfile(username: string) {
  return useQuery<ProfilePageData>({
    queryKey: profileKeys.byUsername(username),
    queryFn: async () => {
      return api.get<ProfilePageData>(`/api/profile/${encodeURIComponent(username)}`);
    },
    enabled: !!username,
  });
}
