import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';
import { formatBookFormat } from '@/lib/charts/formatters';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get all books read in the specified year
    const userBooks = await prisma.userBook.findMany({
      where: {
        userId: user.id,
        finishDate: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        },
        status: {
          in: ['COMPLETED', 'DNF']
        }
      },
      select: {
        format: true
      }
    });

    // Count by format
    const formatCounts: Record<string, number> = {};
    userBooks.forEach(book => {
      const format = book.format;
      formatCounts[format] = (formatCounts[format] || 0) + 1;
    });

    // Convert to array format for pie chart
    const data = Object.entries(formatCounts).map(([format, count]) => ({
      name: formatBookFormat(format),
      value: count
    }));

    // Sort by count descending
    data.sort((a, b) => b.value - a.value);

    return NextResponse.json({
      data,
      year,
      total: userBooks.length
    });
  } catch (error) {
    console.error('Error fetching book format distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch book format distribution' },
      { status: 500 }
    );
  }
}