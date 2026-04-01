/**
 * @jest-environment node
 */

import { GET } from '@/app/api/user/notices/route';
import { POST } from '@/app/api/user/notices/seen/route';
import type { User } from '@prisma/client';

jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    seenNotice: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

jest.mock('@/lib/notices', () => ({
  NOTICES: [],
}));

import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { NOTICES } from '@/lib/notices';

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockNotices = NOTICES as jest.Mocked<typeof NOTICES>;

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  isAdmin: false,
  isSuperAdmin: false,
} as ReturnType<typeof getCurrentUser> extends Promise<infer T> ? NonNullable<T> : never;

const mockDbUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  emailVerified: null,
  name: 'Test User',
  username: null,
  bio: null,
  readingGoal: 12,
  profilePictureUrl: null,
  showCurrentlyReading: false,
  profileEnabled: false,
  showTbr: false,
  dashboardLayout: 'GRID',
  librarySortBy: 'END_DATE',
  librarySortOrder: 'DESC',
  image: null,
  isAdmin: false,
  isSuperAdmin: false,
  selectedTemplateId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/user/notices', () => {
  test('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(401);
  });

  test('returns empty array when all notices are already seen', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (mockPrisma.seenNotice.findMany as jest.Mock).mockResolvedValue([
      { noticeId: 'notice-1' },
    ]);
    mockNotices.push({
      id: 'notice-1',
      title: 'Notice 1',
      component: () => null,
      target: async () => true,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);

    mockNotices.splice(0);
  });

  test('returns only unseen applicable notices', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (mockPrisma.seenNotice.findMany as jest.Mock).mockResolvedValue([
      { noticeId: 'notice-seen' },
    ]);
    mockNotices.push(
      { id: 'notice-seen', title: 'Seen', component: () => null, target: async () => true },
      { id: 'notice-applicable', title: 'New Feature', component: () => null, target: async () => true },
      { id: 'notice-not-targeted', title: 'Not For You', component: () => null, target: async () => false }
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([{ id: 'notice-applicable', title: 'New Feature' }]);

    mockNotices.splice(0);
  });

  test('passes the full db user to target functions', async () => {
    const targetFn = jest.fn().mockResolvedValue(true);
    mockGetCurrentUser.mockResolvedValue(mockUser);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (mockPrisma.seenNotice.findMany as jest.Mock).mockResolvedValue([]);
    mockNotices.push({ id: 'notice-1', title: 'Notice', component: () => null, target: targetFn });

    await GET();

    expect(targetFn).toHaveBeenCalledWith(mockDbUser);

    mockNotices.splice(0);
  });
});

describe('POST /api/user/notices/seen', () => {
  test('returns 401 when not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const request = new Request('http://localhost/api/user/notices/seen', {
      method: 'POST',
      body: JSON.stringify({ noticeId: 'notice-1' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  test('returns 400 for missing noticeId', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const request = new Request('http://localhost/api/user/notices/seen', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  test('returns 400 for unknown noticeId', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const request = new Request('http://localhost/api/user/notices/seen', {
      method: 'POST',
      body: JSON.stringify({ noticeId: 'nonexistent' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  test('upserts seen record for valid noticeId', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);
    (mockPrisma.seenNotice.upsert as jest.Mock).mockResolvedValue({});
    mockNotices.push({ id: 'notice-1', title: 'Notice', component: () => null, target: async () => true });

    const request = new Request('http://localhost/api/user/notices/seen', {
      method: 'POST',
      body: JSON.stringify({ noticeId: 'notice-1' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ ok: true });
    expect(mockPrisma.seenNotice.upsert).toHaveBeenCalledWith({
      where: { userId_noticeId: { userId: 'user-1', noticeId: 'notice-1' } },
      create: { userId: 'user-1', noticeId: 'notice-1' },
      update: {},
    });

    mockNotices.splice(0);
  });
});
