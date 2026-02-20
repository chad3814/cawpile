import { useState } from "react";
import { View, Text, Pressable, useColorScheme, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

const DEV_USER_ID = "cmlvj29pr0000kavbkr62htcc";

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { signIn, devSignIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn();
      router.replace("/(tabs)/library");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Sign in failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await devSignIn(DEV_USER_ID);
      router.replace("/(tabs)/library");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Dev sign in failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
      }}
    >
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        {/* App branding */}
        <Text
          style={{
            fontSize: 42,
            fontWeight: "bold",
            color: "#3b82f6",
            marginBottom: 4,
          }}
        >
          Cawpile
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: isDark ? "#94a3b8" : "#64748b",
            marginBottom: 48,
            textAlign: "center",
            lineHeight: 24,
          }}
        >
          Track your reading with the{"\n"}CAWPILE rating system
        </Text>

        {/* Error message */}
        {error && (
          <View
            style={{
              backgroundColor: isDark ? "#450a0a" : "#fef2f2",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              width: "100%",
              borderWidth: 1,
              borderColor: isDark ? "#7f1d1d" : "#fca5a5",
            }}
          >
            <Text
              style={{
                color: isDark ? "#fca5a5" : "#991b1b",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Sign-in button */}
        <Pressable
          onPress={handleSignIn}
          disabled={isLoading}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#3574d4" : "#4285F4",
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 8,
            width: "100%",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            opacity: isLoading ? 0.7 : 1,
          })}
          testID="google-sign-in-button"
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
          ) : null}
          <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </Text>
        </Pressable>

        {/* Retry hint when there's an error */}
        {error && (
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#64748b" : "#94a3b8",
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Tap the button above to try again
          </Text>
        )}

        {/* Dev sign-in bypass — only shown in development */}
        {__DEV__ && (
          <Pressable
            onPress={handleDevSignIn}
            disabled={isLoading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#4a4a4a" : isDark ? "#334155" : "#64748b",
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 8,
              width: "100%",
              alignItems: "center",
              marginTop: 24,
              opacity: isLoading ? 0.7 : 1,
            })}
          >
            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>
              Dev Sign In (bypass Google)
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
