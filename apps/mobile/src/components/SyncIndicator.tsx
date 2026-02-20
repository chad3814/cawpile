import { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, useColorScheme } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { processQueue, getQueueCount } from "@/lib/offlineQueue";

/**
 * Indicator that shows when queued offline actions are being synced.
 * Triggers queue processing when the device comes back online.
 */
export function SyncIndicator() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const syncQueue = useCallback(async () => {
    const count = await getQueueCount();
    if (count === 0) return;

    setQueueCount(count);
    setIsSyncing(true);

    try {
      await processQueue();
    } finally {
      const remaining = await getQueueCount();
      setQueueCount(remaining);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected === true) {
        syncQueue();
      }
    });
    return unsubscribe;
  }, [syncQueue]);

  if (!isSyncing || queueCount === 0) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: isDark ? "#1e3a5f" : "#dbeafe",
        paddingVertical: 6,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
      }}
      testID="sync-indicator"
    >
      <ActivityIndicator
        size="small"
        color={isDark ? "#60a5fa" : "#3b82f6"}
        style={{ marginRight: 8 }}
      />
      <Text
        style={{
          color: isDark ? "#93c5fd" : "#1e40af",
          fontSize: 13,
          fontWeight: "600",
        }}
      >
        Syncing {queueCount} pending {queueCount === 1 ? "action" : "actions"}...
      </Text>
    </View>
  );
}
