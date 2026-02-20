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

    // Get all books completed or DNF'd in the specified year with disabilityRepresentation set
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
        disabilityRepresentation: {
          not: null
        }
      },
      select: {
        disabilityRepresentation: true
      }
    });

    // Count books by disabilityRepresentation value
    const valueCounts: Record<string, number> = {};
    userBooks.forEach(book => {
      const value = book.disabilityRepresentation;
      if (value) {
        valueCounts[value] = (valueCounts[value] || 0) + 1;
      }
    });

    // Convert to array format with consistent ordering (Yes, No, Unknown)
    const orderedValues = ['Yes', 'No', 'Unknown'];
    const data = orderedValues
      .filter(value => valueCounts[value])
      .map(value => ({
        name: value,
        value: valueCounts[value]
      }));

    return NextResponse.json({
      data,
      year,
      total: userBooks.length
    });
  } catch (error) {
    console.error('Error fetching disability representation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disability representation' },
      { status: 500 }
    );
  }
}
