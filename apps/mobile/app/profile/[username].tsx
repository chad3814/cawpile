import { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Image } from "expo-image";
import { getCawpileGrade, getCawpileColor } from "@cawpile/shared";
import type { CawpileSemanticColor, ProfileBookData, ProfileSharedReview } from "@cawpile/shared";
import { usePublicProfile } from "@/hooks/queries/usePublicProfile";

const SEMANTIC_COLORS: Record<CawpileSemanticColor, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

function resolveCoverUrlFromEdition(edition: ProfileBookData["edition"]): string | null {
  if (edition.hardcoverBook?.imageUrl) return edition.hardcoverBook.imageUrl;
  if (edition.googleBook?.imageUrl) return edition.googleBook.imageUrl;
  if (edition.ibdbBook?.imageUrl) return edition.ibdbBook.imageUrl;
  return null;
}

export default function PublicProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();

  const { data: profileData, isLoading, isError } = usePublicProfile(username);

  const handleBookPress = useCallback(
    (bookId: string) => {
      router.push(`/book/${bookId}`);
    },
    [router],
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: "", headerStyle: { backgroundColor: isDark ? "#0f172a" : "#ffffff" }, headerTintColor: isDark ? "#f8fafc" : "#1a1a1a" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
          <ActivityIndicator size="large" color={isDark ? "#60a5fa" : "#3b82f6"} />
        </View>
      </>
    );
  }

  if (isError || !profileData) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: "Profile", headerStyle: { backgroundColor: isDark ? "#0f172a" : "#ffffff" }, headerTintColor: isDark ? "#f8fafc" : "#1a1a1a" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
          <Text style={{ fontSize: 16, color: isDark ? "#94a3b8" : "#64748b" }}>
            Profile not found.
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: "#3b82f6", fontSize: 14 }}>Go back</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const { user: profileUser, currentlyReading, sharedReviews, tbr } = profileData;
  const avatarUrl = profileUser.profilePictureUrl ?? profileUser.image;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `@${profileUser.username}`,
          headerStyle: { backgroundColor: isDark ? "#0f172a" : "#ffffff" },
          headerTintColor: isDark ? "#f8fafc" : "#1a1a1a",
        }}
      />

      <ScrollView
        testID="public-profile-scroll"
        style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Header */}
        <View style={{ alignItems: "center", paddingTop: 24, paddingBottom: 20 }}>
          {avatarUrl ? (
            <Image
              testID="public-profile-avatar"
              source={{ uri: avatarUrl }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
              contentFit="cover"
              cachePolicy="disk"
            />
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isDark ? "#334155" : "#e2e8f0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 28, color: isDark ? "#64748b" : "#94a3b8" }}>@</Text>
            </View>
          )}

          <Text
            testID="public-profile-name"
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginTop: 12,
            }}
          >
            {profileUser.name}
          </Text>

          <Text
            testID="public-profile-username"
            style={{
              fontSize: 14,
              color: isDark ? "#94a3b8" : "#64748b",
              marginTop: 4,
            }}
          >
            @{profileUser.username}
          </Text>

          {profileUser.bio && (
            <Text
              testID="public-profile-bio"
              style={{
                fontSize: 14,
                color: isDark ? "#cbd5e1" : "#475569",
                marginTop: 8,
                textAlign: "center",
                paddingHorizontal: 32,
                lineHeight: 22,
              }}
            >
              {profileUser.bio}
            </Text>
          )}
        </View>

        {/* Currently Reading */}
        {profileUser.showCurrentlyReading && currentlyReading.length > 0 && (
          <View style={{ marginTop: 8, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: "bold", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 12 }}>
              Currently Reading
            </Text>
            {currentlyReading.map((book: ProfileBookData) => {
              const coverUrl = resolveCoverUrlFromEdition(book.edition);
              return (
                <View
                  key={book.id}
                  testID={`public-reading-${book.id}`}
                  style={{
                    flexDirection: "row",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#334155" : "#e2e8f0",
                  }}
                >
                  {coverUrl ? (
                    <Image
                      source={{ uri: coverUrl }}
                      style={{ width: 40, height: 60, borderRadius: 4, marginRight: 12 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 40, height: 60, borderRadius: 4,
                        backgroundColor: isDark ? "#334155" : "#e2e8f0",
                        marginRight: 12, alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Text style={{ fontSize: 14, color: isDark ? "#64748b" : "#94a3b8" }}>[ ]</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <Text
                      style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#f8fafc" : "#1a1a1a" }}
                      numberOfLines={2}
                    >
                      {book.edition.book.title}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {book.edition.book.authors.join(", ")}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Shared Reviews */}
        {sharedReviews.length > 0 && (
          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: "bold", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 12 }}>
              Shared Reviews
            </Text>
            {sharedReviews.map((review: ProfileSharedReview) => {
              const coverUrl = resolveCoverUrlFromEdition(review.userBook.edition as ProfileBookData["edition"]);
              const rating = review.userBook.cawpileRating;
              return (
                <View
                  key={review.id}
                  testID={`public-review-${review.id}`}
                  style={{
                    flexDirection: "row",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#334155" : "#e2e8f0",
                  }}
                >
                  {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={{ width: 40, height: 60, borderRadius: 4, marginRight: 12 }} contentFit="cover" />
                  ) : (
                    <View style={{ width: 40, height: 60, borderRadius: 4, backgroundColor: isDark ? "#334155" : "#e2e8f0", marginRight: 12, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 14, color: isDark ? "#64748b" : "#94a3b8" }}>[ ]</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#f8fafc" : "#1a1a1a" }} numberOfLines={2}>
                      {review.userBook.edition.book.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", marginTop: 2 }} numberOfLines={1}>
                      {review.userBook.edition.book.authors.join(", ")}
                    </Text>
                    {rating && (
                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SEMANTIC_COLORS[getCawpileColor(rating.average)], marginRight: 4 }} />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: isDark ? "#e2e8f0" : "#334155" }}>
                          {rating.average.toFixed(1)}
                        </Text>
                        <Text style={{ fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", marginLeft: 4 }}>
                          {getCawpileGrade(rating.average)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* TBR Section */}
        {profileUser.showTbr && tbr && tbr.books.length > 0 && (
          <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: "bold", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 12 }}>
              Want to Read ({tbr.totalCount})
            </Text>
            {tbr.books.map((book: ProfileBookData) => (
              <View
                key={book.id}
                testID={`public-tbr-${book.id}`}
                style={{
                  flexDirection: "row",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#334155" : "#e2e8f0",
                }}
              >
                <View style={{ flex: 1, justifyContent: "center" }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#f8fafc" : "#1a1a1a" }} numberOfLines={2}>
                    {book.edition.book.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", marginTop: 2 }} numberOfLines={1}>
                    {book.edition.book.authors.join(", ")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
