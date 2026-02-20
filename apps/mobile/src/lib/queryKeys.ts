import type { BookStatus } from "@cawpile/shared";

/**
 * Query key factory for consistent cache key management across the app.
 * Each factory produces hierarchical keys that enable efficient invalidation.
 */

export const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (status?: BookStatus) => [...bookKeys.lists(), status ?? "all"] as const,
  details: () => [...bookKeys.all, "detail"] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
  searches: () => [...bookKeys.all, "search"] as const,
  search: (query: string) => [...bookKeys.searches(), query] as const,
};

export const sessionKeys = {
  all: ["sessions"] as const,
  forBook: (userBookId: string) => [...sessionKeys.all, "book", userBookId] as const,
};

export const userKeys = {
  all: ["user"] as const,
  settings: () => [...userKeys.all, "settings"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
  bookClubs: () => [...userKeys.all, "book-clubs"] as const,
  readathons: () => [...userKeys.all, "readathons"] as const,
  usernameCheck: (username: string) => [...userKeys.all, "username-check", username] as const,
};

export const profileKeys = {
  all: ["profiles"] as const,
  byUsername: (username: string) => [...profileKeys.all, username] as const,
};
