import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all unique years from user's books
    const userBooks = await prisma.userBook.findMany({
      where: {
        userId: user.id,
        OR: [
          { finishDate: { not: null } },
          { startDate: { not: null } }
        ]
      },
      select: {
        finishDate: true,
        startDate: true
      }
    });

    const yearsSet = new Set<number>();
    const currentYear = new Date().getFullYear();

    // Always include current year
    yearsSet.add(currentYear);

    // Extract years from dates
    userBooks.forEach(book => {
      if (book.finishDate) {
        yearsSet.add(new Date(book.finishDate).getFullYear());
      }
      if (book.startDate) {
        yearsSet.add(new Date(book.startDate).getFullYear());
      }
    });

    // Convert to array and sort descending
    const years = Array.from(yearsSet).sort((a, b) => b - a);

    return NextResponse.json({ years });
  } catch (error) {
    console.error('Error fetching available years:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available years' },
      { status: 500 }
    );
  }
}