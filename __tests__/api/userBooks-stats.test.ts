/**
 * @jest-environment node
 */
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';
import { recomputeBookStats } from '@/lib/db/bookStats';

const prisma = new PrismaClient();

describe('recomputeBookStats integration', () => {
  let userId: string;
  let bookId: string;
  let editionId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `${nanoid()}@t.test` } });
    userId = user.id;
    const book = await prisma.book.create({ data: { title: `T-${nanoid()}`, authors: ['A'] } });
    bookId = book.id;
    const edition = await prisma.edition.create({ data: { bookId } });
    editionId = edition.id;
  });

  afterAll(async () => {
    await prisma.userBook.deleteMany({ where: { userId } });
    await prisma.edition.deleteMany({ where: { bookId } });
    await prisma.book.deleteMany({ where: { id: bookId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('updates readerCount after a userBook is created and recompute runs', async () => {
    await prisma.$transaction(async (tx) => {
      await tx.userBook.create({ data: { userId, editionId, status: 'WANT_TO_READ', format: ['EBOOK'] } });
      await recomputeBookStats(bookId, tx);
    });
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    expect(book?.readerCount).toBe(1);
    expect(book?.ratingCount).toBe(0);
  });

  it('reflects a completed rating then removal', async () => {
    const ub = await prisma.userBook.findFirstOrThrow({ where: { userId, editionId } });
    await prisma.$transaction(async (tx) => {
      await tx.userBook.update({ where: { id: ub.id }, data: { status: 'COMPLETED' } });
      await tx.cawpileRating.create({ data: { userBookId: ub.id, average: 8 } });
      await recomputeBookStats(bookId, tx);
    });
    let book = await prisma.book.findUnique({ where: { id: bookId } });
    expect(book?.ratingCount).toBe(1);
    expect(book?.ratingSum).toBe(8);
    expect(Number.isFinite(book?.bayesianRating ?? NaN)).toBe(true);

    await prisma.$transaction(async (tx) => {
      await tx.userBook.delete({ where: { id: ub.id } });
      await recomputeBookStats(bookId, tx);
    });
    book = await prisma.book.findUnique({ where: { id: bookId } });
    expect(book?.readerCount).toBe(0);
    expect(book?.ratingCount).toBe(0);
  });
});
