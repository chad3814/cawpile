import { NextRequest, NextResponse } from 'next/server';
import {
  getNewestBooks,
  getPopularBooks,
  getTopRatedBooks,
  type RankedBook,
} from '@/lib/db/bookRankings';

const SECTIONS: Record<string, (limit: number, offset: number) => Promise<RankedBook[]>> = {
  newest: getNewestBooks,
  popular: getPopularBooks,
  'top-rated': getTopRatedBooks,
};

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 48;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const section = params.get('section') ?? '';
  const fetcher = SECTIONS[section];
  if (!fetcher) {
    return NextResponse.json({ error: 'Unknown section' }, { status: 400 });
  }

  const offset = Math.max(0, parseInt(params.get('offset') || '0', 10) || 0);
  const rawLimit = parseInt(params.get('limit') || `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT;
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));

  try {
    // Fetch one extra to detect whether more pages exist.
    const rows = await fetcher(limit + 1, offset);
    const hasMore = rows.length > limit;
    return NextResponse.json({ books: rows.slice(0, limit), hasMore });
  } catch (error) {
    console.error('Error fetching books feed:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}
