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

type BookRow = Prisma.BookGetPayload<{ select: typeof BASE_SELECT }>;

function coverFor(row: BookRow): string | null {
  const edition = row.editions[0];
  if (!edition) return null;
  return getCoverImageUrl(edition) ?? null;
}

function toRankedBook(r: BookRow, stat: BookStat): RankedBook {
  return { id: r.id, title: r.title, authors: r.authors, coverUrl: coverFor(r), stat };
}

export async function getNewestBooks(limit: number, offset: number): Promise<RankedBook[]> {
  const rows = await prisma.book.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    take: limit,
    skip: offset,
    select: BASE_SELECT,
  });
  return rows.map((r) => toRankedBook(r, { kind: 'addedAt', value: r.createdAt.toISOString() }));
}

export async function getPopularBooks(limit: number, offset: number): Promise<RankedBook[]> {
  const rows = await prisma.book.findMany({
    orderBy: [{ readerCount: 'desc' }, { id: 'asc' }],
    take: limit,
    skip: offset,
    select: BASE_SELECT,
  });
  return rows.map((r) => toRankedBook(r, { kind: 'readers', value: r.readerCount }));
}

export async function getTopRatedBooks(limit: number, offset: number): Promise<RankedBook[]> {
  const rows = await prisma.book.findMany({
    where: { ratingCount: { gt: 0 } },
    orderBy: [{ bayesianRating: 'desc' }, { id: 'asc' }],
    take: limit,
    skip: offset,
    select: BASE_SELECT,
  });
  return rows.map((r) => toRankedBook(r, { kind: 'rating', value: Math.round(r.bayesianRating * 10) / 10 }));
}
