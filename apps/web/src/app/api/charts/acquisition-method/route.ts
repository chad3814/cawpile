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

    // Get all books completed or DNF'd in the specified year with acquisitionMethod set
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
        acquisitionMethod: {
          not: null
        }
      },
      select: {
        acquisitionMethod: true
      }
    });

    // Count books by acquisition method
    const methodCounts: Record<string, number> = {};
    userBooks.forEach(book => {
      const method = book.acquisitionMethod;
      if (method) {
        // Format the method for display (convert camelCase to readable format)
        const displayMethod = formatMethodName(method);
        methodCounts[displayMethod] = (methodCounts[displayMethod] || 0) + 1;
      }
    });

    // Convert to array format - show all unique values (no "Other" grouping)
    const data = Object.entries(methodCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json({
      data,
      year,
      total: userBooks.length
    });
  } catch (error) {
    console.error('Error fetching acquisition method:', error);
    return NextResponse.json(
      { error: 'Failed to fetch acquisition method' },
      { status: 500 }
    );
  }
}

function formatMethodName(method: string): string {
  // Handle common acquisition methods
  const methodMap: Record<string, string> = {
    'Purchased': 'Purchased',
    'Library': 'Library',
    'FriendBorrowed': 'Friend/Borrowed',
    'Gift': 'Gift',
    'KindleUnlimited': 'Kindle Unlimited',
    'Audible': 'Audible',
    'ARC': 'ARC',
    'Other': 'Other'
  };

  return methodMap[method] || method;
}
