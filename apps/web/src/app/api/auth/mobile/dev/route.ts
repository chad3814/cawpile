import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateMobileJwt } from '@/lib/auth/mobile-jwt';

/**
 * POST /api/auth/mobile/dev
 *
 * Dev-only endpoint that generates a JWT for a given userId
 * without requiring Google Sign-In. Only available in development.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    );
  }

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { userId } = body;
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json(
      { error: 'Missing required field: userId' },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: `User not found: ${userId}` },
        { status: 404 }
      );
    }

    const token = generateMobileJwt({
      userId: user.id,
      email: user.email!,
      name: user.name,
      image: user.image,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('Dev mobile auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
