import { View, Text, Pressable, useColorScheme } from "react-native";
import { Image } from "expo-image";
import { getCawpileGrade, getCawpileColor } from "@cawpile/shared";
import type { DashboardBookData, BookStatus, CawpileSemanticColor } from "@cawpile/shared";

interface BookCardProps {
  book: DashboardBookData;
  onPress: () => void;
}

/**
 * Resolve cover image URL from provider priority:
 * preferredCoverProvider > hardcoverBook > googleBook > ibdbBook
 */
function resolveCoverUrl(book: DashboardBookData): string | null {
  const { edition, preferredCoverProvider } = book;

  // Check preferred provider first
  if (preferredCoverProvider === "hardcover" && edition.hardcoverBook?.imageUrl) {
    return edition.hardcoverBook.imageUrl;
  }
  if (preferredCoverProvider === "google" && edition.googleBook?.imageUrl) {
    return edition.googleBook.imageUrl;
  }
  if (preferredCoverProvider === "ibdb" && edition.ibdbBook?.imageUrl) {
    return edition.ibdbBook.imageUrl;
  }

  // Fallback priority: hardcover > google > ibdb
  if (edition.hardcoverBook?.imageUrl) {
    return edition.hardcoverBook.imageUrl;
  }
  if (edition.googleBook?.imageUrl) {
    return edition.googleBook.imageUrl;
  }
  if (edition.ibdbBook?.imageUrl) {
    return edition.ibdbBook.imageUrl;
  }

  return null;
}

const STATUS_LABELS: Record<BookStatus, string> = {
  WANT_TO_READ: "Want to Read",
  READING: "Reading",
  COMPLETED: "Completed",
  DNF: "DNF",
};

const STATUS_STYLES: Record<BookStatus, { bg: string; text: string; darkBg: string; darkText: string }> = {
  WANT_TO_READ: {
    bg: "#f1f5f9",
    text: "#475569",
    darkBg: "#334155",
    darkText: "#cbd5e1",
  },
  READING: {
    bg: "#dbeafe",
    text: "#1e40af",
    darkBg: "#1e3a5f",
    darkText: "#93c5fd",
  },
  COMPLETED: {
    bg: "#dcfce7",
    text: "#166534",
    darkBg: "#14532d",
    darkText: "#86efac",
  },
  DNF: {
    bg: "#fef2f2",
    text: "#991b1b",
    darkBg: "#450a0a",
    darkText: "#fca5a5",
  },
};

const SEMANTIC_COLORS: Record<CawpileSemanticColor, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

/**
 * Book card component for the library grid.
 * Displays cover image, title, author, status badge, and CAWPILE average if rated.
 */
export default function BookCard({ book, onPress }: BookCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const coverUrl = resolveCoverUrl(book);
  const title = book.edition.book.title;
  const authors = book.edition.book.authors.join(", ");
  const statusStyle = STATUS_STYLES[book.status];
  const rating = book.cawpileRating;

  return (
    <Pressable
      testID={`book-card-${book.id}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        margin: 4,
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isDark ? "#334155" : "#e2e8f0",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {/* Cover Image */}
      <View
        style={{
          width: "100%",
          aspectRatio: 2 / 3,
          backgroundColor: isDark ? "#334155" : "#f1f5f9",
        }}
      >
        {coverUrl ? (
          <Image
            testID={`cover-image-${book.id}`}
            source={{ uri: coverUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="disk"
            recyclingKey={book.id}
          />
        ) : (
          <View
            testID={`cover-placeholder-${book.id}`}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 32,
                color: isDark ? "#64748b" : "#94a3b8",
              }}
            >
              {"[ ]"}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: isDark ? "#64748b" : "#94a3b8",
                marginTop: 4,
                textAlign: "center",
                paddingHorizontal: 8,
              }}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={{ padding: 8 }}>
        {/* Title */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: isDark ? "#f8fafc" : "#1a1a1a",
          }}
          numberOfLines={2}
        >
          {title}
        </Text>

        {/* Authors */}
        <Text
          style={{
            fontSize: 11,
            color: isDark ? "#94a3b8" : "#64748b",
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {authors}
        </Text>

        {/* Status Badge */}
        <View
          style={{
            alignSelf: "flex-start",
            marginTop: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            backgroundColor: isDark ? statusStyle.darkBg : statusStyle.bg,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              color: isDark ? statusStyle.darkText : statusStyle.text,
            }}
          >
            {STATUS_LABELS[book.status]}
          </Text>
        </View>

        {/* CAWPILE Rating (if rated) */}
        {rating && rating.average > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: SEMANTIC_COLORS[getCawpileColor(rating.average)],
                marginRight: 4,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: isDark ? "#e2e8f0" : "#334155",
              }}
            >
              {rating.average.toFixed(1)}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: isDark ? "#94a3b8" : "#64748b",
                marginLeft: 4,
              }}
            >
              {getCawpileGrade(rating.average)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export { resolveCoverUrl };
