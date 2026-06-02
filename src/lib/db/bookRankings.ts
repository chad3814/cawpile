import prisma from '@/lib/prisma';
import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl';

export type BookStat =
  | { kind: 'addedAt'; value: Date }
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

type BookRow = {
  id: string;
  title: string;
  authors: string[];
  createdAt: Date;
  readerCount: number;
  bayesianRating: number;
  editions: Array<Parameters<typeof getCoverImageUrl>[0]>;
};

function coverFor(row: BookRow): string | null {
  const edition = row.editions[0];
  if (!edition) return null;
  return getCoverImageUrl(edition) ?? null;
}

const BASE_SELECT = {
  id: true,
  title: true,
  authors: true,
  createdAt: true,
  readerCount: true,
  bayesianRating: true,
  editions: COVER_EDITION,
} as const;

export async function getNewestBooks(limit: number, offset: number): Promise<RankedBook[]> {
  const rows = (await prisma.book.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    take: limit,
    skip: offset,
    select: BASE_SELECT,
  })) as BookRow[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    authors: r.authors,
    coverUrl: coverFor(r),
    stat: { kind: 'addedAt', value: r.createdAt },
  }));
}

export async function getPopularBooks(limit: number, offset: number): Promise<RankedBook[]> {
  const rows = (await prisma.book.findMany({
    orderBy: [{ readerCount: 'desc' }, { id: 'asc' }],
    take: limit,
    skip: offset,
    select: BASE_SELECT,
  })) as BookRow[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    authors: r.authors,
    coverUrl: coverFor(r),
    stat: { kind: 'readers', value: r.readerCount },
  }));
}

export async function getTopRatedBooks(limit: number, offset: number): Promise<RankedBook[]> {
  const rows = (await prisma.book.findMany({
    where: { ratingCount: { gt: 0 } },
    orderBy: [{ bayesianRating: 'desc' }, { id: 'asc' }],
    take: limit,
    skip: offset,
    select: BASE_SELECT,
  })) as BookRow[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    authors: r.authors,
    coverUrl: coverFor(r),
    stat: { kind: 'rating', value: Math.round(r.bayesianRating * 10) / 10 },
  }));
}
