import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, setupOnlineManager } from "@/lib/queryClient";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SyncIndicator } from "@/components/SyncIndicator";
import { useColorScheme } from "react-native";

/**
 * Auth guard component that redirects unauthenticated users to sign-in.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inSignIn = segments[0] === "sign-in";

    if (!isAuthenticated && !inSignIn) {
      // Redirect to sign-in if not authenticated
      router.replace("/sign-in");
    } else if (isAuthenticated && inSignIn) {
      // Redirect to library if already authenticated and on sign-in
      router.replace("/(tabs)/library");
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Wire TanStack Query online manager to NetInfo
  useEffect(() => {
    const unsubscribe = setupOnlineManager();
    return unsubscribe;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <OfflineBanner />
            <SyncIndicator />
            <AuthGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="(modals)"
                  options={{
                    presentation: "modal",
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="sign-in"
                  options={{
                    headerShown: false,
                    gestureEnabled: false,
                  }}
                />
              </Stack>
            </AuthGuard>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
