import { useEffect, useState } from "react";
import { View, Text, useColorScheme } from "react-native";
import NetInfo from "@react-native-community/netinfo";

/**
 * Subtle banner displayed when the app is offline.
 * Appears at the top of the screen across all routes.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return unsubscribe;
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: isDark ? "#78350f" : "#fef3c7",
        paddingVertical: 6,
        paddingHorizontal: 16,
        alignItems: "center",
      }}
      testID="offline-banner"
    >
      <Text
        style={{
          color: isDark ? "#fde68a" : "#92400e",
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        You are offline. Changes will be synced when you reconnect.
      </Text>
    </View>
  );
}
