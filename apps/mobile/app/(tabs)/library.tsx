import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useLibrary } from "@/hooks/queries/useLibrary";
import { bookKeys } from "@/lib/queryKeys";
import BookCard from "@/components/BookCard";
import type { BookStatus, DashboardBookData, LibrarySortBy, LibrarySortOrder } from "@cawpile/shared";

interface StatusChip {
  label: string;
  value: BookStatus | undefined;
}

const STATUS_CHIPS: StatusChip[] = [
  { label: "All", value: undefined },
  { label: "Reading", value: "READING" },
  { label: "Want to Read", value: "WANT_TO_READ" },
  { label: "Completed", value: "COMPLETED" },
  { label: "DNF", value: "DNF" },
];

const SORT_OPTIONS: { label: string; value: LibrarySortBy }[] = [
  { label: "Date Added", value: "dateAdded" },
  { label: "End Date", value: "endDate" },
  { label: "Start Date", value: "startDate" },
  { label: "Title", value: "title" },
];

const EMPTY_MESSAGES: Record<string, string> = {
  all: "Your library is empty. Search for books to get started!",
  READING: "No books currently being read.",
  WANT_TO_READ: "No books on your want-to-read list.",
  COMPLETED: "No completed books yet.",
  DNF: "No DNF books.",
};

function sortBooks(
  books: DashboardBookData[],
  sortBy: LibrarySortBy,
  sortOrder: LibrarySortOrder,
): DashboardBookData[] {
  const sorted = [...books].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case "title":
        comparison = a.edition.book.title.localeCompare(b.edition.book.title);
        break;
      case "startDate": {
        const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
        const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
        comparison = aDate - bDate;
        break;
      }
      case "endDate": {
        const aEnd = a.finishDate ? new Date(a.finishDate).getTime() : 0;
        const bEnd = b.finishDate ? new Date(b.finishDate).getTime() : 0;
        comparison = aEnd - bEnd;
        break;
      }
      case "dateAdded":
      default: {
        const aCreated = new Date(a.createdAt).getTime();
        const bCreated = new Date(b.createdAt).getTime();
        comparison = aCreated - bCreated;
        break;
      }
    }
    return sortOrder === "desc" ? -comparison : comparison;
  });
  return sorted;
}

export default function LibraryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState<BookStatus | undefined>(undefined);
  const [sortBy, setSortBy] = useState<LibrarySortBy>("dateAdded");
  const [sortOrder, setSortOrder] = useState<LibrarySortOrder>("desc");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { data: books, isLoading, isRefetching, refetch } = useLibrary(selectedStatus);

  const sortedBooks = books ? sortBooks(books, sortBy, sortOrder) : [];

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: bookKeys.all });
    refetch();
  }, [queryClient, refetch]);

  const handleBookPress = useCallback(
    (bookId: string) => {
      router.push(`/book/${bookId}`);
    },
    [router],
  );

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const renderBookCard = useCallback(
    ({ item }: { item: DashboardBookData }) => (
      <BookCard
        book={item}
        onPress={() => handleBookPress(item.id)}
      />
    ),
    [handleBookPress],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    const key = selectedStatus ?? "all";
    return (
      <View
        testID="library-empty-state"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 60,
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            fontSize: 48,
            marginBottom: 16,
          }}
        >
          {"[ ]"}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: isDark ? "#94a3b8" : "#64748b",
            textAlign: "center",
            lineHeight: 24,
          }}
        >
          {EMPTY_MESSAGES[key]}
        </Text>
      </View>
    );
  }, [isLoading, selectedStatus, isDark]);

  // Loading skeleton
  const renderSkeleton = () => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", padding: 4 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          testID={`skeleton-${i}`}
          style={{
            flex: 1,
            minWidth: "45%",
            maxWidth: "50%",
            margin: 4,
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
            borderRadius: 12,
            height: 280,
          }}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
    >
      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 8,
        }}
      >
        {STATUS_CHIPS.map((chip) => {
          const isActive = selectedStatus === chip.value;
          return (
            <Pressable
              key={chip.label}
              testID={`filter-chip-${chip.label.toLowerCase().replace(/\s+/g, "-")}`}
              onPress={() => setSelectedStatus(chip.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: isActive
                  ? (isDark ? "#3b82f6" : "#3b82f6")
                  : (isDark ? "#1e293b" : "#f1f5f9"),
                borderWidth: 1,
                borderColor: isActive
                  ? "#3b82f6"
                  : (isDark ? "#334155" : "#e2e8f0"),
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: isActive
                    ? "#ffffff"
                    : (isDark ? "#94a3b8" : "#475569"),
                }}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sort Control */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: 8,
          justifyContent: "space-between",
        }}
      >
        <Pressable
          testID="sort-button"
          onPress={() => setShowSortMenu(!showSortMenu)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
            }}
          >
            Sort: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          </Text>
        </Pressable>

        <Pressable
          testID="sort-order-toggle"
          onPress={toggleSortOrder}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
            }}
          >
            {sortOrder === "asc" ? "ASC" : "DESC"}
          </Text>
        </Pressable>
      </View>

      {/* Sort Menu Dropdown */}
      {showSortMenu && (
        <View
          style={{
            position: "absolute",
            top: 110,
            left: 16,
            zIndex: 10,
            backgroundColor: isDark ? "#1e293b" : "#ffffff",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isDark ? "#334155" : "#e2e8f0",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              testID={`sort-option-${option.value}`}
              onPress={() => {
                setSortBy(option.value);
                setShowSortMenu(false);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor:
                  sortBy === option.value
                    ? (isDark ? "#334155" : "#f1f5f9")
                    : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? "#e2e8f0" : "#334155",
                  fontWeight: sortBy === option.value ? "600" : "400",
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Book Grid */}
      {isLoading ? (
        renderSkeleton()
      ) : (
        <FlatList
          testID="library-book-list"
          data={sortedBooks}
          renderItem={renderBookCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 4, flexGrow: 1 }}
          columnWrapperStyle={{ justifyContent: "flex-start" }}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={handleRefresh}
              tintColor={isDark ? "#60a5fa" : "#3b82f6"}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
