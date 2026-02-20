import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  signIn as authSignIn,
  signOut as authSignOut,
  devSignIn as authDevSignIn,
  getAuthUser,
  type AuthUser,
} from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  devSignIn: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadUser = async () => {
      try {
        const storedUser = await getAuthUser();
        if (mounted) {
          setUser(storedUser);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async () => {
    const authUser = await authSignIn();
    setUser(authUser);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    queryClient.clear();
    setUser(null);
  }, []);

  const devSignIn = useCallback(async (userId: string) => {
    const authUser = await authDevSignIn(userId);
    setUser(authUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        signIn,
        signOut,
        devSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the auth context. Must be used within an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
