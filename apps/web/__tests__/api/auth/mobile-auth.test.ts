/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/auth/mobile
 *
 * These tests mock the Google tokeninfo endpoint and the Prisma client
 * to verify the mobile authentication flow without external dependencies.
 */

// Mock prisma before importing the route
const mockPrismaAccount = {
  findFirst: jest.fn(),
  create: jest.fn(),
};
const mockPrismaUser = {
  findUnique: jest.fn(),
  create: jest.fn(),
};

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    account: mockPrismaAccount,
    user: mockPrismaUser,
  },
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({
    userId: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    isAdmin: false,
    isSuperAdmin: false,
  })),
}));

// Mock global fetch for Google tokeninfo
const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

import { POST } from '@/app/api/auth/mobile/route';

// Helper to create a Request with JSON body
function createRequest(body: Record<string, string | undefined>): Request {
  return new Request('http://localhost:3000/api/auth/mobile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/mobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret-at-least-32-chars-long-for-jwt';
  });

  it('returns JWT and user data for a valid Google ID token (existing user)', async () => {
    // Mock Google tokeninfo response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
      }),
    });

    // Mock existing account lookup
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/photo.jpg',
      isAdmin: false,
      isSuperAdmin: false,
    };
    mockPrismaAccount.findFirst.mockResolvedValueOnce({
      user: mockUser,
    });

    const request = createRequest({ idToken: 'valid-google-id-token' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe('mock-jwt-token');
    expect(data.user).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/photo.jpg',
    });
  });

  it('returns 401 for an invalid/expired Google ID token', async () => {
    // Mock Google tokeninfo returning an error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const request = createRequest({ idToken: 'invalid-token' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid or expired Google ID token');
  });

  it('returns 400 when idToken is missing from request body', async () => {
    const request = createRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required field: idToken');
  });

  it('creates a new user on first sign-in', async () => {
    // Mock Google tokeninfo response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google-new-456',
        email: 'newuser@example.com',
        name: 'New User',
        picture: 'https://example.com/new-photo.jpg',
      }),
    });

    // Mock: no existing account
    mockPrismaAccount.findFirst.mockResolvedValueOnce(null);
    // Mock: no existing user by email
    mockPrismaUser.findUnique.mockResolvedValueOnce(null);
    // Mock: user creation
    const createdUser = {
      id: 'user-new',
      email: 'newuser@example.com',
      name: 'New User',
      image: 'https://example.com/new-photo.jpg',
      isAdmin: false,
      isSuperAdmin: false,
    };
    mockPrismaUser.create.mockResolvedValueOnce(createdUser);

    const request = createRequest({ idToken: 'valid-new-user-token' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe('mock-jwt-token');
    expect(data.user.email).toBe('newuser@example.com');

    // Verify user was created with account link
    expect(mockPrismaUser.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'newuser@example.com',
          name: 'New User',
          accounts: {
            create: expect.objectContaining({
              provider: 'google',
              providerAccountId: 'google-new-456',
            }),
          },
        }),
      })
    );
  });

  it('returns existing user on subsequent sign-ins', async () => {
    // Mock Google tokeninfo response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: 'google-existing-789',
        email: 'existing@example.com',
        name: 'Existing User',
        picture: 'https://example.com/existing.jpg',
      }),
    });

    // Mock: existing account found
    const existingUser = {
      id: 'user-existing',
      email: 'existing@example.com',
      name: 'Existing User',
      image: 'https://example.com/existing.jpg',
      isAdmin: true,
      isSuperAdmin: false,
    };
    mockPrismaAccount.findFirst.mockResolvedValueOnce({
      user: existingUser,
    });

    const request = createRequest({ idToken: 'valid-existing-token' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe('mock-jwt-token');
    expect(data.user.id).toBe('user-existing');

    // Verify no new user was created
    expect(mockPrismaUser.create).not.toHaveBeenCalled();
  });
});
