import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';
import { createEmptyStackedMonthlyData, processStackedMonthlyData } from '@/lib/charts/processors';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get all books completed or DNF'd in the specified year
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
        finishDate: true,
        status: true
      }
    });

    // Initialize stacked monthly data
    const monthlyData = createEmptyStackedMonthlyData(year);

    // Count books per month by status
    userBooks.forEach(book => {
      if (book.finishDate) {
        const monthIndex = new Date(book.finishDate).getMonth();
        if (book.status === 'COMPLETED') {
          monthlyData[monthIndex].completed++;
        } else if (book.status === 'DNF') {
          monthlyData[monthIndex].dnf++;
        }
      }
    });

    // Process data to trim trailing zeros
    const processedData = processStackedMonthlyData(monthlyData);

    return NextResponse.json({
      data: processedData,
      year,
      total: userBooks.length
    });
  } catch (error) {
    console.error('Error fetching books per month:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books per month' },
      { status: 500 }
    );
  }
}