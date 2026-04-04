/**
 * @jest-environment node
 */

import { PrismaClient, BookStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

jest.mock('@/lib/auth-helpers', () => ({
  getCurrentUser: jest.fn(),
}));

import { getCurrentUser } from '@/lib/auth-helpers';
import { GET } from '@/app/api/user/books/[id]/diversity-defaults/route';
import { NextRequest } from 'next/server';

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

describe('GET /api/user/books/[id]/diversity-defaults', () => {
  let testUserId: string;
  let otherUserId: string;
  let testBookId: string;
  let testEditionId: string;
  const createdUserIds: string[] = [];
  const createdBookIds: string[] = [];

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-diversity-${nanoid(6)}@test.com`,
        name: 'Test Diversity User',
      },
    });
    testUserId = user.id;
    createdUserIds.push(user.id);

    const otherUser = await prisma.user.create({
      data: {
        email: `test-diversity-other-${nanoid(6)}@test.com`,
        name: 'Other Diversity User',
      },
    });
    otherUserId = otherUser.id;
    createdUserIds.push(otherUser.id);

    const book = await prisma.book.create({
      data: {
        title: `Test Diversity Book ${nanoid(6)}`,
        authors: ['Author Alpha', 'Author Beta'],
      },
    });
    testBookId = book.id;
    createdBookIds.push(book.id);

    const edition = await prisma.edition.create({
      data: {
        bookId: book.id,
        isbn13: `978${nanoid(10)}`,
      },
    });
    testEditionId = edition.id;
  });

  afterAll(async () => {
    await prisma.userBook.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    await prisma.edition.deleteMany({
      where: { bookId: { in: createdBookIds } },
    });
    await prisma.book.deleteMany({
      where: { id: { in: createdBookIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds } },
    });
    await prisma.$disconnect();
  });

  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue({
      id: testUserId,
      email: 'test@test.com',
      name: 'Test User',
      isAdmin: false,
      isSuperAdmin: false,
    });
  });

  afterEach(async () => {
    await prisma.userBook.deleteMany({
      where: { userId: { in: createdUserIds } },
    });
    jest.clearAllMocks();
  });

  function makeRequest(userBookId: string) {
    const request = new NextRequest(
      `http://localhost:3000/api/user/books/${userBookId}/diversity-defaults`
    );
    return GET(request, { params: Promise.resolve({ id: userBookId }) });
  }

  test('returns 401 for unauthenticated requests', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    const response = await makeRequest('fake-id');
    expect(response.status).toBe(401);
  });

  test('returns 404 for non-existent book', async () => {
    const response = await makeRequest('non-existent-id');
    expect(response.status).toBe(404);
  });

  test('returns empty defaults when no previous reviews exist', async () => {
    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.COMPLETED,
        format: ['PAPERBACK'],
      },
    });

    const response = await makeRequest(userBook.id);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.defaults).toEqual({});
    expect(data.sources).toEqual({});
  });

  test('returns book-level defaults from other users reviews of the same book', async () => {
    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.COMPLETED,
        format: ['PAPERBACK'],
      },
    });

    // Create a second edition of the same book with a review from another user
    const edition2 = await prisma.edition.create({
      data: {
        bookId: testBookId,
        isbn13: `978${nanoid(10)}`,
      },
    });

    await prisma.userBook.create({
      data: {
        userId: otherUserId,
        editionId: edition2.id,
        status: BookStatus.COMPLETED,
        format: ['EBOOK'],
        lgbtqRepresentation: 'Yes',
        lgbtqDetails: 'Main character is bisexual',
        disabilityRepresentation: 'No',
      },
    });

    const response = await makeRequest(userBook.id);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.defaults.lgbtqRepresentation).toBe('Yes');
    expect(data.defaults.lgbtqDetails).toBe('Main character is bisexual');
    expect(data.defaults.disabilityRepresentation).toBe('No');
    expect(data.sources.lgbtqRepresentation).toBe('same-book');
    expect(data.sources.disabilityRepresentation).toBe('same-book');
  });

  test('returns author-level defaults for authorPoc from reviews of books by same author', async () => {
    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.COMPLETED,
        format: ['PAPERBACK'],
      },
    });

    // Create a different book by the same author
    const otherBook = await prisma.book.create({
      data: {
        title: `Other Book By Same Author ${nanoid(6)}`,
        authors: ['Author Alpha'],
      },
    });
    createdBookIds.push(otherBook.id);

    const otherEdition = await prisma.edition.create({
      data: {
        bookId: otherBook.id,
        isbn13: `978${nanoid(10)}`,
      },
    });

    await prisma.userBook.create({
      data: {
        userId: otherUserId,
        editionId: otherEdition.id,
        status: BookStatus.COMPLETED,
        format: ['HARDCOVER'],
        authorPoc: 'Yes',
        authorPocDetails: 'Korean-American',
      },
    });

    const response = await makeRequest(userBook.id);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.defaults.authorPoc).toBe('Yes');
    expect(data.defaults.authorPocDetails).toBe('Korean-American');
    expect(data.sources.authorPoc).toBe('same-author');
  });

  test('defaults isNewAuthor to false when user has other books by same author', async () => {
    // Create a different book by the same author, owned by the test user
    const otherBook = await prisma.book.create({
      data: {
        title: `Another Alpha Book ${nanoid(6)}`,
        authors: ['Author Alpha'],
      },
    });
    createdBookIds.push(otherBook.id);

    const otherEdition = await prisma.edition.create({
      data: {
        bookId: otherBook.id,
        isbn13: `978${nanoid(10)}`,
      },
    });

    await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: otherEdition.id,
        status: BookStatus.COMPLETED,
        format: ['PAPERBACK'],
      },
    });

    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.COMPLETED,
        format: ['EBOOK'],
      },
    });

    const response = await makeRequest(userBook.id);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.defaults.isNewAuthor).toBe(false);
    expect(data.sources.isNewAuthor).toBe('user-history');
  });

  test('uses majority vote when multiple reviews disagree', async () => {
    const userBook = await prisma.userBook.create({
      data: {
        userId: testUserId,
        editionId: testEditionId,
        status: BookStatus.COMPLETED,
        format: ['PAPERBACK'],
      },
    });

    // Create multiple editions with conflicting reviews
    const edition1 = await prisma.edition.create({
      data: { bookId: testBookId, isbn13: `978${nanoid(10)}` },
    });
    const edition2 = await prisma.edition.create({
      data: { bookId: testBookId, isbn13: `978${nanoid(10)}` },
    });
    const edition3 = await prisma.edition.create({
      data: { bookId: testBookId, isbn13: `978${nanoid(10)}` },
    });
    const editions = [edition1, edition2, edition3];

    // Create a third user for the extra review
    const thirdUser = await prisma.user.create({
      data: {
        email: `test-diversity-third-${nanoid(6)}@test.com`,
        name: 'Third User',
      },
    });
    createdUserIds.push(thirdUser.id);

    // 2 say Yes, 1 says No -> majority is Yes
    await prisma.userBook.create({
      data: {
        userId: otherUserId,
        editionId: editions[0].id,
        status: BookStatus.COMPLETED,
        format: ['EBOOK'],
        lgbtqRepresentation: 'Yes',
      },
    });
    await prisma.userBook.create({
      data: {
        userId: thirdUser.id,
        editionId: editions[1].id,
        status: BookStatus.COMPLETED,
        format: ['HARDCOVER'],
        lgbtqRepresentation: 'Yes',
      },
    });
    // Use otherUserId on a different edition that says No
    // Actually we need another user since otherUser already has editions[0]
    const fourthUser = await prisma.user.create({
      data: {
        email: `test-diversity-fourth-${nanoid(6)}@test.com`,
        name: 'Fourth User',
      },
    });
    createdUserIds.push(fourthUser.id);

    await prisma.userBook.create({
      data: {
        userId: fourthUser.id,
        editionId: editions[2].id,
        status: BookStatus.COMPLETED,
        format: ['AUDIOBOOK'],
        lgbtqRepresentation: 'No',
      },
    });

    const response = await makeRequest(userBook.id);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.defaults.lgbtqRepresentation).toBe('Yes');
  });
});
