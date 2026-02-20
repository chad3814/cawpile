import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { userKeys } from "@/lib/queryKeys";

/**
 * Shape of the user settings returned by GET /api/user/settings.
 */
export interface UserSettings {
  name: string | null;
  username: string | null;
  bio: string | null;
  email: string;
  readingGoal: number | null;
  profileEnabled: boolean;
  showCurrentlyReading: boolean;
  showTbr: boolean;
  image: string | null;
  profilePictureUrl: string | null;
}

/**
 * Query hook for fetching current user settings.
 * Calls GET /api/user/settings.
 */
export function useSettings() {
  return useQuery<UserSettings>({
    queryKey: userKeys.settings(),
    queryFn: async () => {
      return api.get<UserSettings>("/api/user/settings");
    },
  });
}
