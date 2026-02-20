import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';
import { aggregatePieData } from '@/lib/charts/processors';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get all books completed or DNF'd in the specified year with primaryGenre set
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
        edition: {
          book: {
            primaryGenre: {
              not: null
            }
          }
        }
      },
      select: {
        edition: {
          select: {
            book: {
              select: {
                primaryGenre: true
              }
            }
          }
        }
      }
    });

    // Count books by genre
    const genreCounts: Record<string, number> = {};
    userBooks.forEach(book => {
      const genre = book.edition?.book?.primaryGenre;
      if (genre) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    });

    // Convert to array format
    const data = Object.entries(genreCounts).map(([name, value]) => ({
      name,
      value
    }));

    // Aggregate to top genres with "Other" category if needed
    const aggregatedData = aggregatePieData(data, 7);

    return NextResponse.json({
      data: aggregatedData,
      year,
      total: userBooks.length
    });
  } catch (error) {
    console.error('Error fetching main genres:', error);
    return NextResponse.json(
      { error: 'Failed to fetch main genres' },
      { status: 500 }
    );
  }
}
