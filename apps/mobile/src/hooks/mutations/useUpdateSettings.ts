import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { userKeys, profileKeys } from "@/lib/queryKeys";

/**
 * Input data for updating user settings.
 */
export interface UpdateSettingsInput {
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  readingGoal?: number | null;
  profileEnabled?: boolean;
  showCurrentlyReading?: boolean;
  showTbr?: boolean;
}

/**
 * Mutation hook for updating user settings.
 * Calls PATCH /api/user/settings with the updated fields.
 * Invalidates settings and profile caches on success.
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation<Record<string, unknown>, ApiError, UpdateSettingsInput>({
    mutationFn: async (input: UpdateSettingsInput) => {
      const body: Record<string, unknown> = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.username !== undefined) body.username = input.username;
      if (input.bio !== undefined) body.bio = input.bio;
      if (input.readingGoal !== undefined) body.readingGoal = input.readingGoal;
      if (input.profileEnabled !== undefined) body.profileEnabled = input.profileEnabled;
      if (input.showCurrentlyReading !== undefined) body.showCurrentlyReading = input.showCurrentlyReading;
      if (input.showTbr !== undefined) body.showTbr = input.showTbr;

      return api.patch<Record<string, unknown>>("/api/user/settings", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.settings() });
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
