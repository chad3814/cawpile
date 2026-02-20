import { QueryClient, onlineManager } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";

/**
 * Wire TanStack Query's onlineManager to NetInfo so that queries
 * automatically pause when the device is offline and resume when
 * connectivity returns.
 */
export function setupOnlineManager(): () => void {
  return NetInfo.addEventListener((state) => {
    onlineManager.setOnline(state.isConnected === true);
  });
}

/**
 * TanStack Query client configured with sensible defaults for the mobile app.
 *
 * - 5-minute stale time: data is considered fresh for 5 minutes before refetching
 * - 30-minute garbage collection: unused cache entries are removed after 30 minutes
 * - 3 retries with exponential backoff: retries failed requests with increasing delays
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});
