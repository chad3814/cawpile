import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useUpdateProgress } from "@/hooks/mutations/useUpdateProgress";

export default function UpdateProgressModal() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    progress: string;
    currentPage: string;
  }>();

  const initialProgress = parseInt(params.progress || "0", 10);
  const initialPage = parseInt(params.currentPage || "0", 10);

  const [progress, setProgress] = useState(initialProgress);
  const [currentPage, setCurrentPage] = useState(initialPage > 0 ? String(initialPage) : "");

  const updateProgress = useUpdateProgress(params.id);

  const handleSubmit = useCallback(() => {
    const pageNumber = currentPage ? parseInt(currentPage, 10) : undefined;
    updateProgress.mutate(
      {
        progress,
        currentPage: pageNumber,
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }, [progress, currentPage, updateProgress, router]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: isDark ? "#f8fafc" : "#1a1a1a",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        Update Progress
      </Text>

      {/* Percentage Slider */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: isDark ? "#f8fafc" : "#1a1a1a",
            marginBottom: 12,
          }}
        >
          Reading Progress
        </Text>

        {/* Percentage display */}
        <Text
          testID="progress-display"
          style={{
            fontSize: 40,
            fontWeight: "bold",
            color: "#3b82f6",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          {progress}%
        </Text>

        {/* Progress bar */}
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: isDark ? "#334155" : "#e2e8f0",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "#3b82f6",
              width: `${progress}%`,
            }}
          />
        </View>

        {/* Quick select buttons */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {[0, 10, 25, 50, 75, 100].map((val) => (
            <Pressable
              key={val}
              testID={`progress-preset-${val}`}
              onPress={() => setProgress(val)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: progress === val
                  ? "#3b82f6"
                  : (isDark ? "#1e293b" : "#f1f5f9"),
                borderWidth: 1,
                borderColor: progress === val ? "#3b82f6" : (isDark ? "#334155" : "#e2e8f0"),
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: progress === val ? "#ffffff" : (isDark ? "#94a3b8" : "#475569"),
                }}
              >
                {val}%
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Manual input */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
          <TextInput
            testID="progress-input"
            value={String(progress)}
            onChangeText={(text) => {
              const val = parseInt(text, 10);
              if (!isNaN(val) && val >= 0 && val <= 100) {
                setProgress(val);
              } else if (text === "") {
                setProgress(0);
              }
            }}
            keyboardType="numeric"
            style={{
              flex: 1,
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: isDark ? "#f8fafc" : "#1a1a1a",
              textAlign: "center",
            }}
          />
          <Text style={{ marginLeft: 8, fontSize: 14, color: isDark ? "#94a3b8" : "#64748b" }}>
            %
          </Text>
        </View>
      </View>

      {/* Page Number */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: isDark ? "#f8fafc" : "#1a1a1a",
            marginBottom: 8,
          }}
        >
          Current Page (optional)
        </Text>
        <TextInput
          testID="page-input"
          value={currentPage}
          onChangeText={(text) => {
            const val = parseInt(text, 10);
            if (!isNaN(val) && val >= 0) {
              setCurrentPage(String(val));
            } else if (text === "") {
              setCurrentPage("");
            }
          }}
          keyboardType="numeric"
          placeholder="Enter page number"
          placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
          style={{
            backgroundColor: isDark ? "#1e293b" : "#f8fafc",
            borderWidth: 1,
            borderColor: isDark ? "#334155" : "#e2e8f0",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 14,
            color: isDark ? "#f8fafc" : "#1a1a1a",
          }}
        />
      </View>

      {/* Submit Button */}
      <Pressable
        testID="submit-progress-button"
        onPress={handleSubmit}
        disabled={updateProgress.isPending}
        style={({ pressed }) => ({
          paddingVertical: 14,
          borderRadius: 10,
          backgroundColor: pressed ? "#2563eb" : "#3b82f6",
          alignItems: "center",
          opacity: updateProgress.isPending ? 0.6 : 1,
        })}
      >
        {updateProgress.isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
            Update Progress
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
