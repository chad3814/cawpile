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
import { useCreateReadingSession } from "@/hooks/mutations/useCreateReadingSession";

export default function LogSessionModal() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<{ userBookId: string }>();

  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const createSession = useCreateReadingSession();

  const validate = useCallback((): boolean => {
    const start = parseInt(startPage, 10);
    const end = parseInt(endPage, 10);

    if (isNaN(start) || isNaN(end)) {
      setValidationError("Start page and end page are required.");
      return false;
    }

    if (start < 0) {
      setValidationError("Start page must be 0 or greater.");
      return false;
    }

    if (end <= start) {
      setValidationError("End page must be greater than start page.");
      return false;
    }

    setValidationError(null);
    return true;
  }, [startPage, endPage]);

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const start = parseInt(startPage, 10);
    const end = parseInt(endPage, 10);
    const dur = duration ? parseInt(duration, 10) : undefined;

    createSession.mutate(
      {
        userBookId: params.userBookId,
        startPage: start,
        endPage: end,
        duration: dur,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }, [startPage, endPage, duration, notes, params.userBookId, createSession, router, validate]);

  const pagesRead = (() => {
    const start = parseInt(startPage, 10);
    const end = parseInt(endPage, 10);
    if (!isNaN(start) && !isNaN(end) && end > start) {
      return end - start + 1;
    }
    return null;
  })();

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
        Log Reading Session
      </Text>

      {/* Start Page */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: isDark ? "#f8fafc" : "#1a1a1a",
            marginBottom: 8,
          }}
        >
          Start Page *
        </Text>
        <TextInput
          testID="start-page-input"
          value={startPage}
          onChangeText={(text) => {
            const val = parseInt(text, 10);
            if (!isNaN(val) && val >= 0) {
              setStartPage(String(val));
            } else if (text === "") {
              setStartPage("");
            }
            setValidationError(null);
          }}
          keyboardType="numeric"
          placeholder="e.g., 1"
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

      {/* End Page */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: isDark ? "#f8fafc" : "#1a1a1a",
            marginBottom: 8,
          }}
        >
          End Page *
        </Text>
        <TextInput
          testID="end-page-input"
          value={endPage}
          onChangeText={(text) => {
            const val = parseInt(text, 10);
            if (!isNaN(val) && val >= 0) {
              setEndPage(String(val));
            } else if (text === "") {
              setEndPage("");
            }
            setValidationError(null);
          }}
          keyboardType="numeric"
          placeholder="e.g., 50"
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

      {/* Pages Read Preview */}
      {pagesRead !== null && (
        <View
          testID="pages-read-preview"
          style={{
            backgroundColor: isDark ? "#1e293b" : "#f0f9ff",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#93c5fd" : "#1e40af",
              fontWeight: "600",
            }}
          >
            {pagesRead} pages will be logged
          </Text>
        </View>
      )}

      {/* Duration */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: isDark ? "#f8fafc" : "#1a1a1a",
            marginBottom: 8,
          }}
        >
          Duration in minutes (optional)
        </Text>
        <TextInput
          testID="duration-input"
          value={duration}
          onChangeText={(text) => {
            const val = parseInt(text, 10);
            if (!isNaN(val) && val >= 0) {
              setDuration(String(val));
            } else if (text === "") {
              setDuration("");
            }
          }}
          keyboardType="numeric"
          placeholder="e.g., 30"
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

      {/* Notes */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: isDark ? "#f8fafc" : "#1a1a1a",
            marginBottom: 8,
          }}
        >
          Notes (optional)
        </Text>
        <TextInput
          testID="notes-input"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholder="Any thoughts about this reading session..."
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
            minHeight: 100,
            textAlignVertical: "top",
          }}
        />
      </View>

      {/* Validation Error */}
      {validationError && (
        <View
          testID="validation-error"
          style={{
            backgroundColor: isDark ? "#450a0a" : "#fef2f2",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDark ? "#7f1d1d" : "#fca5a5",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#fca5a5" : "#991b1b",
            }}
          >
            {validationError}
          </Text>
        </View>
      )}

      {/* Submit Button */}
      <Pressable
        testID="submit-session-button"
        onPress={handleSubmit}
        disabled={createSession.isPending}
        style={({ pressed }) => ({
          paddingVertical: 14,
          borderRadius: 10,
          backgroundColor: pressed ? "#2563eb" : "#3b82f6",
          alignItems: "center",
          opacity: createSession.isPending ? 0.6 : 1,
        })}
      >
        {createSession.isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
            Log Session
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
