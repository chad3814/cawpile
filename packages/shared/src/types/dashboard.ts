import type { BookStatus, BookFormat } from './enums';

export interface SharedReviewData {
  id: string;
  shareToken: string;
  showDates: boolean;
  showBookClubs: boolean;
  showReadathons: boolean;
  showReview: boolean;
}

export interface CawpileRatingData {
  id: string;
  average: number;
  characters: number | null;
  atmosphere: number | null;
  writing: number | null;
  plot: number | null;
  intrigue: number | null;
  logic: number | null;
  enjoyment: number | null;
}

export interface DashboardBookData {
  id: string;
  status: BookStatus;
  format: BookFormat[];
  progress: number;
  startDate: Date | null;
  finishDate: Date | null;
  createdAt: Date;
  review?: string | null;
  acquisitionMethod?: string | null;
  acquisitionOther?: string | null;
  bookClubName?: string | null;
  readathonName?: string | null;
  isReread?: boolean | null;
  dnfReason?: string | null;
  lgbtqRepresentation?: string | null;
  lgbtqDetails?: string | null;
  disabilityRepresentation?: string | null;
  disabilityDetails?: string | null;
  isNewAuthor?: boolean | null;
  authorPoc?: string | null;
  authorPocDetails?: string | null;
  notes?: string | null;
  preferredCoverProvider?: string | null;
  edition: {
    id: string;
    title: string | null;
    book: {
      title: string;
      authors: string[];
      bookType?: 'FICTION' | 'NONFICTION';
    };
    googleBook: {
      imageUrl: string | null;
      description: string | null;
      pageCount: number | null;
    } | null;
    hardcoverBook: {
      imageUrl: string | null;
    } | null;
    ibdbBook: {
      imageUrl: string | null;
    } | null;
  };
  cawpileRating?: CawpileRatingData | null;
  sharedReview?: SharedReviewData | null;
}
