import jwt from 'jsonwebtoken';

/**
 * JWT payload for mobile authentication.
 */
export interface MobileJwtPayload {
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const JWT_EXPIRY = '30d'; // 30-day expiry

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required for mobile JWT');
  }
  return secret;
}

/**
 * Generates a signed JWT for mobile authentication.
 * Contains user identity and admin flags.
 * Signed with NEXTAUTH_SECRET and expires in 30 days.
 */
export function generateMobileJwt(user: MobileJwtPayload): string {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      name: user.name,
      image: user.image,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    },
    getSecret(),
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Verifies and decodes a mobile JWT.
 * Returns the decoded payload or throws if invalid/expired.
 */
export function verifyMobileJwt(token: string): MobileJwtPayload {
  const decoded = jwt.verify(token, getSecret()) as jwt.JwtPayload & MobileJwtPayload;

  return {
    userId: decoded.userId,
    email: decoded.email,
    name: decoded.name,
    image: decoded.image,
    isAdmin: decoded.isAdmin,
    isSuperAdmin: decoded.isSuperAdmin,
  };
}
