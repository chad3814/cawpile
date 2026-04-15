import { BookType, BookStatus } from '@prisma/client';

export interface AuthorBookEntry {
  bookId: string;
  title: string;
  bookType: BookType;
  coverImageUrl: string | null;
  averageRating: number | null;
  totalRatings: number;
  totalReaders: number;
}

export interface TrackedBookEntry extends AuthorBookEntry {
  userBookStatus: BookStatus;
  userRating: number | null;
}

export interface AuthorPageData {
  authorName: string;
  totalBooks: number;
  totalReaders: number;
  trackedBooks: TrackedBookEntry[];
  otherBooks: AuthorBookEntry[];
}
