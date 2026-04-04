import { BookType } from '@prisma/client';

export interface BookPageData {
  book: {
    id: string;
    title: string;
    authors: string[];
    bookType: BookType;
  };
  edition: {
    id: string;
    title: string | null;
    defaultCoverProvider: string | null;
    googleBook: {
      imageUrl: string | null;
      description: string | null;
    } | null;
    hardcoverBook: {
      imageUrl: string | null;
      description: string | null;
    } | null;
    ibdbBook: {
      imageUrl: string | null;
      description: string | null;
    } | null;
  };
  aggregatedRating: AggregatedCawpileRating | null;
  publicReviews: PublicBookReview[];
  totalRatingCount: number;
}

export interface AggregatedCawpileRating {
  characters: number | null;
  atmosphere: number | null;
  writing: number | null;
  plot: number | null;
  intrigue: number | null;
  logic: number | null;
  enjoyment: number | null;
  average: number;
}

export interface PublicBookReview {
  shareToken: string;
  user: {
    username: string | null;
    name: string | null;
    profilePictureUrl: string | null;
    image: string | null;
    profileEnabled: boolean;
  };
  rating: {
    average: number;
    characters: number | null;
    atmosphere: number | null;
    writing: number | null;
    plot: number | null;
    intrigue: number | null;
    logic: number | null;
    enjoyment: number | null;
  };
  review: string | null;
  finishDate: Date | null;
}
