import { verifyMobileJwt } from './mobile-jwt';
import prisma from '@/lib/prisma';

interface MobileUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * Extracts the Bearer token from the Authorization header,
 * verifies the JWT, and fetches the user from the database.
 *
 * Returns the user object if authentication succeeds, or null if
 * no Bearer token is present or the token is invalid.
 */
export async function getMobileUser(request: Request): Promise<MobileUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix
  if (!token) {
    return null;
  }

  try {
    const payload = verifyMobileJwt(token);

    // Fetch the actual user from the database to get up-to-date admin flags
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        isAdmin: true,
        isSuperAdmin: true,
      },
    });

    if (!user || !user.email) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    };
  } catch {
    // Token verification failed (expired, invalid signature, etc.)
    return null;
  }
}
