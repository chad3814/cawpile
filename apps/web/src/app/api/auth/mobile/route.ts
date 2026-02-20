import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateMobileJwt } from '@/lib/auth/mobile-jwt';

interface GoogleTokenInfo {
  sub: string;
  email: string;
  email_verified: string;
  name: string;
  picture: string;
  error_description?: string;
}

/**
 * POST /api/auth/mobile
 *
 * Accepts a Google ID token from a native mobile sign-in,
 * validates it with Google's tokeninfo endpoint,
 * finds or creates the user and their Google account link,
 * and returns a signed JWT for subsequent API calls.
 */
export async function POST(request: Request) {
  let body: { idToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { idToken } = body;
  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json(
      { error: 'Missing required field: idToken' },
      { status: 400 }
    );
  }

  // Validate the Google ID token
  let tokenInfo: GoogleTokenInfo;
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Invalid or expired Google ID token' },
        { status: 401 }
      );
    }

    tokenInfo = await response.json() as GoogleTokenInfo;
  } catch {
    return NextResponse.json(
      { error: 'Failed to validate Google ID token' },
      { status: 401 }
    );
  }

  // Verify the token contains the required fields
  if (!tokenInfo.sub || !tokenInfo.email) {
    return NextResponse.json(
      { error: 'Invalid token payload: missing sub or email' },
      { status: 401 }
    );
  }

  try {
    // Find existing account by Google provider ID
    const existingAccount = await prisma.account.findFirst({
      where: {
        provider: 'google',
        providerAccountId: tokenInfo.sub,
      },
      include: {
        user: true,
      },
    });

    let user;

    if (existingAccount) {
      // Existing user -- return them
      user = existingAccount.user;
    } else {
      // Check if user exists by email (may have signed up via web)
      const existingUser = await prisma.user.findUnique({
        where: { email: tokenInfo.email },
      });

      if (existingUser) {
        // User exists but no Google account link -- create the account link
        await prisma.account.create({
          data: {
            userId: existingUser.id,
            type: 'oauth',
            provider: 'google',
            providerAccountId: tokenInfo.sub,
          },
        });
        user = existingUser;
      } else {
        // Brand new user -- create user + account in a transaction
        user = await prisma.user.create({
          data: {
            email: tokenInfo.email,
            name: tokenInfo.name || null,
            image: tokenInfo.picture || null,
            emailVerified: new Date(),
            accounts: {
              create: {
                type: 'oauth',
                provider: 'google',
                providerAccountId: tokenInfo.sub,
              },
            },
          },
        });
      }
    }

    // Generate JWT
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
    console.error('Mobile auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
