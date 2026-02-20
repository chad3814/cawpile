// Re-export all profile types from the shared package.
// The shared package defines these without @prisma/client imports,
// using standalone string union types instead.
export type {
  ProfileUserData,
  ProfileBookData,
  ProfileTbrData,
  ProfileSharedReview,
  ProfilePageData,
} from '@cawpile/shared';
