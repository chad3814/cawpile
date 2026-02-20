import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Alert,
  Share,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useShareReview } from "@/hooks/mutations/useShareReview";
import { useDeleteShare } from "@/hooks/mutations/useDeleteShare";
import { getBaseUrl } from "@/lib/api";

export default function ShareReviewModal() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    existingShareToken: string;
    existingShowDates: string;
    existingShowBookClubs: string;
    existingShowReadathons: string;
    existingShowReview: string;
  }>();

  const hasExistingShare = !!params.existingShareToken;

  const [showDates, setShowDates] = useState(params.existingShowDates === "true");
  const [showBookClubs, setShowBookClubs] = useState(params.existingShowBookClubs === "true");
  const [showReadathons, setShowReadathons] = useState(params.existingShowReadathons === "true");
  const [showReview, setShowReview] = useState(params.existingShowReview === "true");

  const shareReview = useShareReview(params.id);
  const deleteShare = useDeleteShare(params.id);

  const handleCreateOrUpdate = useCallback(() => {
    shareReview.mutate(
      {
        showDates,
        showBookClubs,
        showReadathons,
        showReview,
      },
      {
        onSuccess: (data) => {
          if (data.shareToken && data.shareToken !== "pending") {
            let baseUrl: string;
            try {
              baseUrl = getBaseUrl();
            } catch {
              baseUrl = "https://cawpile.app";
            }
            const shareUrl = `${baseUrl}/share/reviews/${data.shareToken}`;
            Share.share({
              message: `Check out my book review on Cawpile: ${shareUrl}`,
              url: shareUrl,
            });
          }
          router.back();
        },
      },
    );
  }, [showDates, showBookClubs, showReadathons, showReview, shareReview, router]);

  const handleDeleteShare = useCallback(() => {
    Alert.alert(
      "Delete Share",
      "Are you sure you want to remove this shared review?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteShare.mutate(undefined, {
              onSuccess: () => {
                router.back();
              },
            });
          },
        },
      ],
    );
  }, [deleteShare, router]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: isDark ? "#f8fafc" : "#1a1a1a",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {hasExistingShare ? "Update Share" : "Share Review"}
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: isDark ? "#94a3b8" : "#64748b",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        Choose what to include in your shared review.
      </Text>

      {/* Privacy Toggles */}
      <View
        style={{
          backgroundColor: isDark ? "#1e293b" : "#f8fafc",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>
            Show Dates
          </Text>
          <Switch
            testID="share-show-dates"
            value={showDates}
            onValueChange={setShowDates}
            trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>
            Show Book Clubs
          </Text>
          <Switch
            testID="share-show-book-clubs"
            value={showBookClubs}
            onValueChange={setShowBookClubs}
            trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>
            Show Readathons
          </Text>
          <Switch
            testID="share-show-readathons"
            value={showReadathons}
            onValueChange={setShowReadathons}
            trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
          />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>
            Show Review Text
          </Text>
          <Switch
            testID="share-show-review"
            value={showReview}
            onValueChange={setShowReview}
            trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
          />
        </View>
      </View>

      {/* Create/Update Button */}
      <Pressable
        testID="share-submit-button"
        onPress={handleCreateOrUpdate}
        disabled={shareReview.isPending}
        style={({ pressed }) => ({
          paddingVertical: 14,
          borderRadius: 10,
          backgroundColor: pressed ? "#2563eb" : "#3b82f6",
          alignItems: "center",
          opacity: shareReview.isPending ? 0.6 : 1,
          marginBottom: 12,
        })}
      >
        {shareReview.isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
            {hasExistingShare ? "Update Share" : "Create Share"}
          </Text>
        )}
      </Pressable>

      {/* Delete Share (only if existing) */}
      {hasExistingShare && (
        <Pressable
          testID="share-delete-button"
          onPress={handleDeleteShare}
          disabled={deleteShare.isPending}
          style={({ pressed }) => ({
            paddingVertical: 14,
            borderRadius: 10,
            backgroundColor: pressed
              ? (isDark ? "#7f1d1d" : "#fee2e2")
              : (isDark ? "#450a0a" : "#fef2f2"),
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDark ? "#7f1d1d" : "#fca5a5",
            opacity: deleteShare.isPending ? 0.6 : 1,
          })}
        >
          {deleteShare.isPending ? (
            <ActivityIndicator size="small" color={isDark ? "#fca5a5" : "#991b1b"} />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#fca5a5" : "#991b1b" }}>
              Delete Share
            </Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}
