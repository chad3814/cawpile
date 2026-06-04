import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl';

export type BookStat =
  // `addedAt` is an ISO 8601 string, not a Date: this value crosses both the RSC
  // boundary (initial render) and the JSON boundary (GET /api/books "load more").
  // JSON stringifies Dates, so a Date type would be honest only on the first path
  // and lie on the second. A string serializes identically over both.
  | { kind: 'addedAt'; value: string }
  | { kind: 'readers'; value: number }
  | { kind: 'rating'; value: number };

export interface RankedBook {
  id: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  stat: BookStat;
}

export interface RankedBookDetail extends RankedBook {
  averageRating: number | null;
  ratingCount: number;
  description: string | null;
}

const COVER_EDITION = {
  orderBy: { createdAt: 'asc' as const },
  take: 1,
  select: {
    defaultCoverProvider: true,
    customCoverUrl: true,
    hardcoverBook: { select: { imageUrl: true } },
    googleBook: { select: { imageUrl: true } },
    ibdbBook: { select: { imageUrl: true } },
    amazonBook: { select: { imageUrl: true } },
  },
} as const;

const BASE_SELECT = {
  id: true,
  title: true,
  authors: true,
  createdAt: true,
  readerCount: true,
  bayesianRating: true,
  editions: COVER_EDITION,
} as const;

const DETAIL_SELECT = {
  id: true,
  title: true,
  authors: true,
  createdAt: true,
  readerCount: true,
  bayesianRating: true,
  ratingCount: true,
  ratingSum: true,
  editions: {
    orderBy: { createdAt: 'asc' as const },
    take: 1,
    select: {
      defaultCoverProvider: true,
      customCoverUrl: true,
      hardcoverBook: { select: { imageUrl: true, description: true } },
      googleBook: { select: { imageUrl: true, description: true } },
      ibdbBook: { select: { imageUrl: true, description: true } },
      amazonBook: { select: { imageUrl: true } },
    },
  },
} as const;

type BookRow = Prisma.BookGetPayload<{ select: typeof BASE_SELECT }>;
type DetailRow = Prisma.BookGetPayload<{ select: typeof DETAIL_SELECT }>;

function coverFor(row: BookRow): string | null {
  const edition = row.editions[0];
  if (!edition) return null;
  return getCoverImageUrl(edition) ?? null;
}

function toRankedBook(r: BookRow, stat: BookStat): RankedBook {
  return { id: r.id, title: r.title, authors: r.authors, coverUrl: coverFor(r), stat };
}

function toRankedBookDetail(r: DetailRow, stat: BookStat): RankedBookDetail {
  const edition = r.editions[0];
  const coverUrl = edition ? getCoverImageUrl(edition) ?? null : null;
  // Description sources mirror the book-page hero (BookPageClient): google →
  // hardcover → ibdb. Amazon is intentionally excluded (not a description source
  // there), so DETAIL_SELECT doesn't fetch amazonBook.description.
  const description =
    edition?.googleBook?.description ||
    edition?.hardcoverBook?.description ||
    edition?.ibdbBook?.description ||
    null;
  const averageRating =
    r.ratingCount > 0 ? Math.round((r.ratingSum / r.ratingCount) * 10) / 10 : null;
  return {
    id: r.id,
    title: r.title,
    authors: r.authors,
    coverUrl,
    stat,
    averageRating,
    ratingCount: r.ratingCount,
    description,
  };
}

export function getNewestBooks(limit: number, offset: number): Promise<RankedBook[]>;
export function getNewestBooks(limit: number, offset: number, detail: true): Promise<RankedBookDetail[]>;
export async function getNewestBooks(
  limit: number,
  offset: number,
  detail = false,
): Promise<RankedBook[] | RankedBookDetail[]> {
  const order = [{ createdAt: 'desc' as const }, { id: 'asc' as const }];
  if (detail) {
    const rows = await prisma.book.findMany({ orderBy: order, take: limit, skip: offset, select: DETAIL_SELECT });
    return rows.map((r) => toRankedBookDetail(r, { kind: 'addedAt', value: r.createdAt.toISOString() }));
  }
  const rows = await prisma.book.findMany({ orderBy: order, take: limit, skip: offset, select: BASE_SELECT });
  return rows.map((r) => toRankedBook(r, { kind: 'addedAt', value: r.createdAt.toISOString() }));
}

export function getPopularBooks(limit: number, offset: number): Promise<RankedBook[]>;
export function getPopularBooks(limit: number, offset: number, detail: true): Promise<RankedBookDetail[]>;
export async function getPopularBooks(
  limit: number,
  offset: number,
  detail = false,
): Promise<RankedBook[] | RankedBookDetail[]> {
  const order = [{ readerCount: 'desc' as const }, { id: 'asc' as const }];
  if (detail) {
    const rows = await prisma.book.findMany({ orderBy: order, take: limit, skip: offset, select: DETAIL_SELECT });
    return rows.map((r) => toRankedBookDetail(r, { kind: 'readers', value: r.readerCount }));
  }
  const rows = await prisma.book.findMany({ orderBy: order, take: limit, skip: offset, select: BASE_SELECT });
  return rows.map((r) => toRankedBook(r, { kind: 'readers', value: r.readerCount }));
}

export function getTopRatedBooks(limit: number, offset: number): Promise<RankedBook[]>;
export function getTopRatedBooks(limit: number, offset: number, detail: true): Promise<RankedBookDetail[]>;
export async function getTopRatedBooks(
  limit: number,
  offset: number,
  detail = false,
): Promise<RankedBook[] | RankedBookDetail[]> {
  const where = { ratingCount: { gt: 0 } };
  const order = [{ bayesianRating: 'desc' as const }, { id: 'asc' as const }];
  if (detail) {
    const rows = await prisma.book.findMany({ where, orderBy: order, take: limit, skip: offset, select: DETAIL_SELECT });
    return rows.map((r) => toRankedBookDetail(r, { kind: 'rating', value: Math.round(r.bayesianRating * 10) / 10 }));
  }
  const rows = await prisma.book.findMany({ where, orderBy: order, take: limit, skip: offset, select: BASE_SELECT });
  return rows.map((r) => toRankedBook(r, { kind: 'rating', value: Math.round(r.bayesianRating * 10) / 10 }));
}
