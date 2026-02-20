import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { verifyMobileJwt } from "@/lib/auth/mobile-jwt";

export async function getCurrentUser() {
  // Primary path: NextAuth cookie-based session (web)
  const session = await auth();

  if (session?.user?.email) {
    try {
      // Get or create user in database
      let user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });

      if (!user) {
        // Create user if doesn't exist
        user = await prisma.user.create({
          data: {
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
            emailVerified: new Date(),
          }
        });
      }

      return {
        ...session.user,
        id: user.id,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  // Fallback path: Bearer JWT authentication (mobile)
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.slice(7);
    if (!token) {
      return null;
    }

    const payload = verifyMobileJwt(token);

    // Fetch the user from the database to get up-to-date data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
    // JWT verification failed or headers not available
    return null;
  }
}
