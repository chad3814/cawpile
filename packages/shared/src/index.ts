// @cawpile/shared - Shared types and utilities for the Cawpile monorepo
// This package is intentionally free of React or Prisma dependencies.

// Types - enums / union types
export type {
  BookStatus,
  BookFormat,
  BookType,
  DashboardLayout,
  LibrarySortBy,
  LibrarySortOrder,
} from './types/enums';

// Types - book
export type {
  GoogleBookResult,
  BookSearchResult,
  GoogleBooksResponse,
  Book,
  Edition,
  GoogleBook,
  HardcoverBook,
  IbdbBook,
  BookWithEditions,
  EnrichedBookData,
  BookTrackingData,
  AdditionalDetailsData,
  UserBookClub,
  UserReadathon,
} from './types/book';
export { AcquisitionMethod, RepresentationValue } from './types/book';

// Types - cawpile
export type {
  CawpileFacet,
  CawpileRating,
  CawpileSemanticColor,
} from './types/cawpile';

// Types - dashboard
export type {
  SharedReviewData,
  CawpileRatingData,
  DashboardBookData,
} from './types/dashboard';

// Types - profile
export type {
  ProfileUserData,
  ProfileBookData,
  ProfileTbrData,
  ProfileSharedReview,
  ProfilePageData,
} from './types/profile';

// Utilities - cawpile
export {
  FICTION_FACETS,
  NONFICTION_FACETS,
  RATING_SCALE_GUIDE,
  getFacetConfig,
  calculateCawpileAverage,
  convertToStars,
  getCawpileGrade,
  getCawpileColor,
} from './utils/cawpile';

// Utilities - book type detection
export {
  NON_FICTION_CATEGORIES,
  detectBookType,
  isNonFictionCategory,
} from './utils/bookType';
