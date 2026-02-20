// Re-export all dashboard types from the shared package.
// The shared package defines these without @prisma/client imports,
// using standalone string union types instead.
export type {
  SharedReviewData,
  CawpileRatingData,
  DashboardBookData,
} from '@cawpile/shared';
