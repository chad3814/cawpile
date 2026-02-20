import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get all books completed or DNF'd in the specified year with isNewAuthor set
    const userBooks = await prisma.userBook.findMany({
      where: {
        userId: user.id,
        finishDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        },
        status: {
          in: ['COMPLETED', 'DNF']
        },
        isNewAuthor: {
          not: null
        }
      },
      select: {
        isNewAuthor: true
      }
    });

    // Count books by isNewAuthor value (boolean -> Yes/No)
    const valueCounts: Record<string, number> = {
      'Yes': 0,
      'No': 0
    };

    userBooks.forEach(book => {
      if (book.isNewAuthor === true) {
        valueCounts['Yes']++;
      } else if (book.isNewAuthor === false) {
        valueCounts['No']++;
      }
    });

    // Convert to array format, filtering out zero values
    const data = Object.entries(valueCounts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      data,
      year,
      total: userBooks.length
    });
  } catch (error) {
    console.error('Error fetching new authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch new authors' },
      { status: 500 }
    );
  }
}
