/**
 * @jest-environment node
 */
jest.mock('@/lib/db/bookRankings', () => ({
  getNewestBooks: jest.fn(),
  getPopularBooks: jest.fn(),
  getTopRatedBooks: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/books/route';
import { getNewestBooks, getPopularBooks } from '@/lib/db/bookRankings';

function req(url: string) {
  return new NextRequest(new URL(url, 'http://localhost'));
}

describe('GET /api/books', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 for an unknown section', async () => {
    const res = await GET(req('http://localhost/api/books?section=nope'));
    expect(res.status).toBe(400);
  });

  it('returns books and hasMore=false when fewer than limit returned', async () => {
    (getNewestBooks as jest.Mock).mockResolvedValue([{ id: 'b1' }]);
    const res = await GET(req('http://localhost/api/books?section=newest&offset=0&limit=24'));
    const body = await res.json();
    // fetched limit+1 (25) to detect more; only 1 returned → no more
    expect(getNewestBooks).toHaveBeenCalledWith(25, 0);
    expect(body.hasMore).toBe(false);
    expect(body.books).toHaveLength(1);
  });

  it('trims to limit and sets hasMore=true when limit+1 returned', async () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ id: `b${i}` }));
    (getPopularBooks as jest.Mock).mockResolvedValue(many);
    const res = await GET(req('http://localhost/api/books?section=popular&limit=24'));
    const body = await res.json();
    expect(body.books).toHaveLength(24);
    expect(body.hasMore).toBe(true);
  });

  it('clamps an over-limit request to MAX_LIMIT', async () => {
    (getNewestBooks as jest.Mock).mockResolvedValue([]);
    await GET(req('http://localhost/api/books?section=newest&limit=999'));
    expect(getNewestBooks).toHaveBeenCalledWith(49, 0); // 48 + 1
  });

  it('forwards offset to the fetcher', async () => {
    (getNewestBooks as jest.Mock).mockResolvedValue([]);
    await GET(req('http://localhost/api/books?section=newest&offset=24&limit=24'));
    expect(getNewestBooks).toHaveBeenCalledWith(25, 24);
  });
});
