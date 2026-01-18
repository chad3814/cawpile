import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';
import { createEmptyMonthlyData, processMonthlyData } from '@/lib/charts/processors';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get all books completed or DNF'd in the specified year
    // Include page count from GoogleBook - we'll filter out audiobooks in JS
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
        format: true,
        edition: {
          select: {
            googleBook: {
              select: {
                pageCount: true
              }
            }
          }
        }
      }
    });

    // Initialize monthly data
    const monthlyData = createEmptyMonthlyData(year);

    // Sum pages per month, excluding audiobooks
    let totalPages = 0;
    userBooks.forEach(book => {
      // Skip if the format includes AUDIOBOOK
      if (book.format && book.format.includes('AUDIOBOOK')) {
        return;
      }

      if (book.finishDate && book.edition?.googleBook?.pageCount) {
        const monthIndex = new Date(book.finishDate).getMonth();
        const pages = book.edition.googleBook.pageCount;
        monthlyData[monthIndex].value += pages;
        totalPages += pages;
      }
    });

    // Process data to trim trailing zeros
    const processedData = processMonthlyData(monthlyData);

    return NextResponse.json({
      data: processedData,
      year,
      total: totalPages
    });
  } catch (error) {
    console.error('Error fetching pages per month:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages per month' },
      { status: 500 }
    );
  }
}
