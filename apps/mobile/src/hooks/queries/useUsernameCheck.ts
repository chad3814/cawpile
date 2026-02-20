import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { userKeys } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * Response from the username availability check endpoint.
 */
export interface UsernameCheckResult {
  available: boolean;
  message?: string;
}

/**
 * Query hook for checking username availability.
 * Calls GET /api/user/username-check?username= with 500ms debounce.
 *
 * @param username - The username to check
 * @returns TanStack Query result with availability status
 */
export function useUsernameCheck(username: string) {
  const debouncedUsername = useDebounce(username, 500);

  return useQuery<UsernameCheckResult>({
    queryKey: userKeys.usernameCheck(debouncedUsername),
    queryFn: async () => {
      return api.get<UsernameCheckResult>(
        `/api/user/username-check?username=${encodeURIComponent(debouncedUsername)}`,
      );
    },
    enabled: debouncedUsername.trim().length >= 3,
  });
}
