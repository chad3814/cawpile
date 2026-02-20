import * as SecureStore from "expo-secure-store";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const JWT_STORAGE_KEY = "cawpile_jwt";

/**
 * User data decoded from the JWT payload.
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * Response from the mobile auth endpoint.
 */
interface MobileAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
}

/**
 * Decode a JWT payload without verifying the signature.
 * Verification happens server-side; this is for reading claims client-side.
 */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const payload = parts[1];
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded) as Record<string, unknown>;
}

/**
 * Check if a JWT token has expired based on its exp claim.
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);
    const exp = payload.exp as number | undefined;
    if (!exp) {
      return true;
    }
    // Expired if current time is past the expiry (with 60s buffer)
    return Date.now() >= (exp - 60) * 1000;
  } catch {
    return true;
  }
}

/**
 * Read the stored JWT from secure storage.
 * Returns null if no token is stored or if the token has expired.
 */
export async function getStoredToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(JWT_STORAGE_KEY);
    if (!token) {
      return null;
    }
    if (isTokenExpired(token)) {
      // Clear expired token
      await SecureStore.deleteItemAsync(JWT_STORAGE_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Store a JWT in secure storage.
 */
export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(JWT_STORAGE_KEY, token);
}

/**
 * Clear the stored JWT from secure storage.
 */
export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(JWT_STORAGE_KEY);
}

/**
 * Check whether the user is currently authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getStoredToken();
  return token !== null;
}

/**
 * Get user data from the stored JWT.
 * Returns null if no valid token is stored.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const token = await getStoredToken();
  if (!token) {
    return null;
  }
  try {
    const payload = decodeJwtPayload(token);
    return {
      id: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string | null) ?? null,
      image: (payload.image as string | null) ?? null,
      isAdmin: (payload.isAdmin as boolean) ?? false,
      isSuperAdmin: (payload.isSuperAdmin as boolean) ?? false,
    };
  } catch {
    return null;
  }
}

/**
 * Sign in with Google.
 *
 * 1. Triggers native Google Sign-In to obtain an ID token
 * 2. Sends the ID token to POST /api/auth/mobile on the backend
 * 3. Stores the returned JWT in secure storage
 * 4. Returns the authenticated user data
 */
export async function signIn(): Promise<AuthUser> {
  // Trigger native Google Sign-In
  await GoogleSignin.hasPlayServices();
  const signInResult = await GoogleSignin.signIn();

  const idToken = signInResult.data?.idToken;
  if (!idToken) {
    throw new Error("No ID token received from Google Sign-In");
  }

  // Exchange the Google ID token for a Cawpile JWT
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/api/auth/mobile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = (errorBody as Record<string, string> | null)?.error ?? "Authentication failed";
    throw new Error(message);
  }

  const data = await response.json() as MobileAuthResponse;

  // Store the JWT securely
  await storeToken(data.token);

  // Return user data from the JWT
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Failed to decode user data from token");
  }

  return user;
}

/**
 * Sign out by clearing all auth state.
 *
 * 1. Clears the JWT from secure storage
 * 2. Signs out from Google Sign-In
 */
export async function signOut(): Promise<void> {
  await clearToken();
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google sign-out may fail if not previously signed in; ignore
  }
}
