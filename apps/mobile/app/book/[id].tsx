import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Image } from "expo-image";
import { useQueryClient } from "@tanstack/react-query";
import {
  getCawpileGrade,
  getCawpileColor,
  convertToStars,
} from "@cawpile/shared";
import type {
  CawpileSemanticColor,
  BookStatus,
  BookFormat,
  CawpileRatingData,
} from "@cawpile/shared";
import { useBookDetails } from "@/hooks/queries/useBookDetails";
import { useReadingSessions } from "@/hooks/queries/useReadingSessions";
import type { ReadingSession } from "@/hooks/queries/useReadingSessions";
import { useDeleteBook } from "@/hooks/mutations/useDeleteBook";
import { resolveCoverUrl } from "@/components/BookCard";
import { bookKeys } from "@/lib/queryKeys";

const SEMANTIC_COLORS: Record<CawpileSemanticColor, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

const STATUS_LABELS: Record<BookStatus, string> = {
  WANT_TO_READ: "Want to Read",
  READING: "Reading",
  COMPLETED: "Completed",
  DNF: "DNF",
};

const STATUS_COLORS: Record<BookStatus, { bg: string; text: string; darkBg: string; darkText: string }> = {
  WANT_TO_READ: { bg: "#f1f5f9", text: "#475569", darkBg: "#334155", darkText: "#cbd5e1" },
  READING: { bg: "#dbeafe", text: "#1e40af", darkBg: "#1e3a5f", darkText: "#93c5fd" },
  COMPLETED: { bg: "#dcfce7", text: "#166534", darkBg: "#14532d", darkText: "#86efac" },
  DNF: { bg: "#fef2f2", text: "#991b1b", darkBg: "#450a0a", darkText: "#fca5a5" },
};

const FORMAT_LABELS: Record<BookFormat, string> = {
  HARDCOVER: "Hardcover",
  PAPERBACK: "Paperback",
  EBOOK: "E-book",
  AUDIOBOOK: "Audiobook",
};

const RATING_FACETS = [
  { name: "Characters", key: "characters" as const },
  { name: "Atmosphere", key: "atmosphere" as const },
  { name: "Writing", key: "writing" as const },
  { name: "Plot", key: "plot" as const },
  { name: "Intrigue", key: "intrigue" as const },
  { name: "Logic", key: "logic" as const },
  { name: "Enjoyment", key: "enjoyment" as const },
];

export default function BookDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: book, isLoading } = useBookDetails(id);
  const { data: sessionsData } = useReadingSessions(id);
  const deleteBookMutation = useDeleteBook();

  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Delete Book",
      "Are you sure you want to remove this book from your library?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteBookMutation.mutate(id, {
              onSuccess: () => {
                router.back();
              },
            });
          },
        },
      ],
    );
  }, [id, deleteBookMutation, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
        <ActivityIndicator size="large" color={isDark ? "#60a5fa" : "#3b82f6"} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: isDark ? "#0f172a" : "#ffffff" }}>
        <Text style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 16 }}>
          Book not found
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: "#3b82f6", fontSize: 14 }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const coverUrl = resolveCoverUrl(book);
  const gb = book.edition.googleBook;
  const title = book.edition.book.title;
  const authors = book.edition.book.authors;
  const description = gb?.description;
  const pageCount = gb?.pageCount;
  const statusColor = STATUS_COLORS[book.status];
  const rating = book.cawpileRating;
  const canShare = (book.status === "COMPLETED" || book.status === "DNF") && rating;
  const sharedReview = book.sharedReview;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerStyle: { backgroundColor: isDark ? "#0f172a" : "#ffffff" },
          headerTintColor: isDark ? "#f8fafc" : "#1a1a1a",
        }}
      />

      <ScrollView
        testID="book-details-scroll"
        style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Cover Image */}
        <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 20 }}>
          {coverUrl ? (
            <Image
              testID="detail-cover-image"
              source={{ uri: coverUrl }}
              style={{ width: 180, height: 270, borderRadius: 8 }}
              contentFit="cover"
              cachePolicy="disk"
            />
          ) : (
            <View
              testID="detail-cover-placeholder"
              style={{
                width: 180,
                height: 270,
                borderRadius: 8,
                backgroundColor: isDark ? "#334155" : "#f1f5f9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 40, color: isDark ? "#64748b" : "#94a3b8" }}>{"[ ]"}</Text>
            </View>
          )}
        </View>

        {/* Book Metadata Section */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text
            testID="detail-title"
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              textAlign: "center",
            }}
          >
            {title}
          </Text>

          <Text
            testID="detail-authors"
            style={{
              fontSize: 15,
              color: isDark ? "#94a3b8" : "#64748b",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            {authors.join(", ")}
          </Text>

          {/* Description */}
          {description && (
            <View style={{ marginTop: 16 }}>
              <Text
                testID="detail-description"
                style={{
                  fontSize: 14,
                  color: isDark ? "#cbd5e1" : "#475569",
                  lineHeight: 22,
                }}
                numberOfLines={descriptionExpanded ? undefined : 3}
              >
                {description}
              </Text>
              {description.length > 150 && (
                <Pressable
                  testID="show-more-button"
                  onPress={() => setDescriptionExpanded(!descriptionExpanded)}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#3b82f6",
                      fontWeight: "600",
                      marginTop: 4,
                    }}
                  >
                    {descriptionExpanded ? "Show less" : "Show more"}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Page Count */}
          {pageCount && (
            <Text
              testID="detail-page-count"
              style={{
                fontSize: 13,
                color: isDark ? "#94a3b8" : "#64748b",
                marginTop: 12,
              }}
            >
              {pageCount} pages
            </Text>
          )}
        </View>

        {/* User Data Section */}
        <View
          testID="user-data-section"
          style={{
            marginTop: 24,
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: isDark ? "#1e293b" : "#f8fafc",
            marginHorizontal: 16,
            borderRadius: 12,
          }}
        >
          {/* Status Badge */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View
              testID="detail-status-badge"
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: isDark ? statusColor.darkBg : statusColor.bg,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isDark ? statusColor.darkText : statusColor.text,
                }}
              >
                {STATUS_LABELS[book.status]}
              </Text>
            </View>
          </View>

          {/* Format Badges */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {book.format.map((f) => (
              <View
                key={f}
                testID={`detail-format-${f}`}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 4,
                  backgroundColor: isDark ? "#334155" : "#e2e8f0",
                }}
              >
                <Text style={{ fontSize: 11, color: isDark ? "#cbd5e1" : "#475569" }}>
                  {FORMAT_LABELS[f]}
                </Text>
              </View>
            ))}
          </View>

          {/* Progress Bar (Reading status) */}
          {book.status === "READING" && (
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>Progress</Text>
                <Text testID="detail-progress" style={{ fontSize: 12, fontWeight: "600", color: isDark ? "#e2e8f0" : "#334155" }}>
                  {book.progress}%
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isDark ? "#334155" : "#e2e8f0",
                }}
              >
                <View
                  testID="detail-progress-bar"
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#3b82f6",
                    width: `${book.progress}%`,
                  }}
                />
              </View>
            </View>
          )}

          {/* Dates */}
          {book.startDate && (
            <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 4 }}>
              Started: {new Date(book.startDate).toLocaleDateString()}
            </Text>
          )}
          {book.finishDate && (
            <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>
              Finished: {new Date(book.finishDate).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Tracking Section */}
        <View
          testID="tracking-section"
          style={{
            marginTop: 12,
            paddingHorizontal: 16,
            paddingVertical: 16,
            backgroundColor: isDark ? "#1e293b" : "#f8fafc",
            marginHorizontal: 16,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginBottom: 8,
            }}
          >
            Tracking Details
          </Text>
          {book.acquisitionMethod && (
            <Text style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569", marginBottom: 4 }}>
              Acquired: {book.acquisitionMethod}
            </Text>
          )}
          {book.bookClubName && (
            <Text style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569", marginBottom: 4 }}>
              Book Club: {book.bookClubName}
            </Text>
          )}
          {book.readathonName && (
            <Text style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569", marginBottom: 4 }}>
              Readathon: {book.readathonName}
            </Text>
          )}
          {book.isReread && (
            <Text style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569", marginBottom: 4 }}>
              Reread: Yes
            </Text>
          )}
          {book.lgbtqRepresentation && (
            <Text style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569", marginBottom: 4 }}>
              LGBTQ+ Representation: {book.lgbtqRepresentation}
            </Text>
          )}
          {book.disabilityRepresentation && (
            <Text style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569", marginBottom: 4 }}>
              Disability Representation: {book.disabilityRepresentation}
            </Text>
          )}
          {book.isNewAuthor && (
            <Text style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569", marginBottom: 4 }}>
              New Author: Yes
            </Text>
          )}
          {book.authorPoc && (
            <Text style={{ fontSize: 13, color: isDark ? "#cbd5e1" : "#475569" }}>
              Author POC: {book.authorPoc}
            </Text>
          )}
        </View>

        {/* CAWPILE Rating Section */}
        {rating && rating.average > 0 && (
          <View
            testID="rating-section"
            style={{
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              marginHorizontal: 16,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#f8fafc" : "#1a1a1a",
                marginBottom: 12,
              }}
            >
              CAWPILE Rating
            </Text>

            {/* Average and Grade */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                testID="detail-rating-average"
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: SEMANTIC_COLORS[getCawpileColor(rating.average)],
                }}
              >
                {rating.average.toFixed(1)}
              </Text>
              <View style={{ marginLeft: 12 }}>
                <Text
                  testID="detail-rating-grade"
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: isDark ? "#e2e8f0" : "#334155",
                  }}
                >
                  {getCawpileGrade(rating.average)}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#94a3b8" : "#64748b",
                  }}
                >
                  {"*".repeat(convertToStars(rating.average))}
                </Text>
              </View>
            </View>

            {/* Facet Breakdown */}
            {RATING_FACETS.map((facet) => {
              const value = rating[facet.key as keyof CawpileRatingData] as number | null;
              if (value === null || value === undefined) return null;
              const numValue = typeof value === "number" ? value : 0;
              return (
                <View key={facet.key} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>
                      {facet.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: SEMANTIC_COLORS[getCawpileColor(numValue)],
                      }}
                    >
                      {numValue}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isDark ? "#334155" : "#e2e8f0",
                    }}
                  >
                    <View
                      style={{
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: SEMANTIC_COLORS[getCawpileColor(numValue)],
                        width: `${(numValue / 10) * 100}%`,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Review Section */}
        {book.review && (
          <View
            testID="review-section"
            style={{
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              marginHorizontal: 16,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#f8fafc" : "#1a1a1a",
                marginBottom: 8,
              }}
            >
              Review
            </Text>
            <Text
              testID="review-text"
              style={{
                fontSize: 14,
                color: isDark ? "#cbd5e1" : "#475569",
                lineHeight: 22,
              }}
            >
              {book.review}
            </Text>
          </View>
        )}

        {/* Reading Sessions Section */}
        {sessionsData && sessionsData.sessions.length > 0 && (
          <View
            testID="sessions-section"
            style={{
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              marginHorizontal: 16,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#f8fafc" : "#1a1a1a",
                marginBottom: 12,
              }}
            >
              Reading Sessions ({sessionsData.total})
            </Text>
            {sessionsData.sessions.map((session: ReadingSession) => (
              <View
                key={session.id}
                testID={`session-${session.id}`}
                style={{
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#334155" : "#e2e8f0",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 13, color: isDark ? "#e2e8f0" : "#334155" }}>
                    Pages {session.startPage} - {session.endPage}
                  </Text>
                  <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }}>
                    {session.pagesRead} pages
                  </Text>
                </View>
                {session.duration && (
                  <Text style={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b", marginTop: 2 }}>
                    {session.duration} minutes
                  </Text>
                )}
                {session.notes && (
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDark ? "#cbd5e1" : "#475569",
                      marginTop: 4,
                      fontStyle: "italic",
                    }}
                  >
                    {session.notes}
                  </Text>
                )}
                <Text style={{ fontSize: 11, color: isDark ? "#64748b" : "#94a3b8", marginTop: 2 }}>
                  {new Date(session.sessionDate).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View
          testID="action-buttons"
          style={{
            marginTop: 24,
            paddingHorizontal: 16,
            gap: 10,
          }}
        >
          {book.status === "READING" && (
            <Pressable
              testID="update-progress-button"
              onPress={() => router.push({
                pathname: "/(modals)/update-progress",
                params: { id: book.id, progress: String(book.progress), currentPage: "0" },
              })}
              style={{
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: "#3b82f6",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>
                Update Progress
              </Text>
            </Pressable>
          )}

          <Pressable
            testID="log-session-button"
            onPress={() => router.push({
              pathname: "/(modals)/log-session",
              params: { userBookId: book.id },
            })}
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
            }}
          >
            <Text style={{ color: isDark ? "#e2e8f0" : "#334155", fontSize: 14, fontWeight: "600" }}>
              Log Session
            </Text>
          </Pressable>

          <Pressable
            testID="rate-button"
            onPress={() => router.push({
              pathname: "/(modals)/rate-book",
              params: {
                id: book.id,
                bookType: book.edition.book.bookType ?? "FICTION",
                existingRating: book.cawpileRating ? JSON.stringify(book.cawpileRating) : "",
              },
            })}
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
            }}
          >
            <Text style={{ color: isDark ? "#e2e8f0" : "#334155", fontSize: 14, fontWeight: "600" }}>
              {rating ? "Edit Rating" : "Rate (CAWPILE)"}
            </Text>
          </Pressable>

          {/* Share Button */}
          {canShare && (
            <Pressable
              testID="share-button"
              onPress={() => router.push({
                pathname: "/(modals)/share-review",
                params: {
                  id: book.id,
                  existingShareToken: sharedReview?.shareToken ?? "",
                  existingShowDates: sharedReview?.showDates ? "true" : "false",
                  existingShowBookClubs: sharedReview?.showBookClubs ? "true" : "false",
                  existingShowReadathons: sharedReview?.showReadathons ? "true" : "false",
                  existingShowReview: sharedReview?.showReview ? "true" : "false",
                },
              })}
              style={{
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
              }}
            >
              <Text style={{ color: isDark ? "#e2e8f0" : "#334155", fontSize: 14, fontWeight: "600" }}>
                {sharedReview ? "Edit Share" : "Share Review"}
              </Text>
            </Pressable>
          )}

          {/* Edit Button */}
          <Pressable
            testID="edit-button"
            onPress={() => router.push({
              pathname: "/(modals)/edit-book",
              params: {
                id: book.id,
                bookData: JSON.stringify(book),
              },
            })}
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
            }}
          >
            <Text style={{ color: isDark ? "#e2e8f0" : "#334155", fontSize: 14, fontWeight: "600" }}>
              Edit
            </Text>
          </Pressable>

          <Pressable
            testID="delete-button"
            onPress={handleDelete}
            style={{
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: isDark ? "#450a0a" : "#fef2f2",
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "#7f1d1d" : "#fca5a5",
            }}
          >
            <Text style={{ color: isDark ? "#fca5a5" : "#991b1b", fontSize: 14, fontWeight: "600" }}>
              Delete
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
