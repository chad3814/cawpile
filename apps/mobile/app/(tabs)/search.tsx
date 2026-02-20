import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useBookSearch } from "@/hooks/queries/useBookSearch";
import type { SignedBookSearchResult } from "@/hooks/queries/useBookSearch";

const TAG_PATTERN = /^(ibdb|hard|gbid|isbn):/i;

const PROVIDER_COLORS: Record<string, string> = {
  google: "#4285F4",
  hardcover: "#8B5CF6",
  ibdb: "#F59E0B",
  local: "#22C55E",
};

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const [query, setQuery] = useState("");
  const { books, isLoading, isError, refetch, taggedSearch, taggedProvider } = useBookSearch(query);

  const isTagged = TAG_PATTERN.test(query);

  const handleResultPress = useCallback(
    (result: SignedBookSearchResult) => {
      router.push({
        pathname: "/(modals)/add-book",
        params: { signedResult: JSON.stringify(result) },
      });
    },
    [router],
  );

  const renderResult = useCallback(
    ({ item }: { item: SignedBookSearchResult }) => (
      <Pressable
        testID={`search-result-${item.id}`}
        onPress={() => handleResultPress(item)}
        style={({ pressed }) => ({
          flexDirection: "row",
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#334155" : "#e2e8f0",
          backgroundColor: pressed
            ? (isDark ? "#1e293b" : "#f8fafc")
            : "transparent",
        })}
      >
        {/* Cover Thumbnail */}
        <View
          style={{
            width: 48,
            height: 72,
            borderRadius: 4,
            overflow: "hidden",
            backgroundColor: isDark ? "#334155" : "#f1f5f9",
            marginRight: 12,
          }}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 48, height: 72 }}
              contentFit="cover"
              cachePolicy="disk"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 16, color: isDark ? "#64748b" : "#94a3b8" }}>
                {"[ ]"}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
            }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {item.authors.join(", ")}
          </Text>

          {/* Source Badges */}
          {item.sources && item.sources.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                marginTop: 6,
                gap: 4,
              }}
            >
              {item.sources.map((source, idx) => (
                <View
                  key={idx}
                  testID={`source-badge-${source.provider}`}
                  style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor: PROVIDER_COLORS[source.provider] ?? "#6b7280",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "600",
                      color: "#ffffff",
                      textTransform: "capitalize",
                    }}
                  >
                    {source.provider}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    ),
    [handleResultPress, isDark],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    if (!query.trim()) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 60,
          }}
        >
          <Text
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            {"()"}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: isDark ? "#94a3b8" : "#64748b",
              textAlign: "center",
            }}
          >
            Search for books to add to your library
          </Text>
        </View>
      );
    }
    return (
      <View
        testID="search-empty-state"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 60,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: isDark ? "#94a3b8" : "#64748b",
            textAlign: "center",
          }}
        >
          No books found
        </Text>
      </View>
    );
  }, [isLoading, query, isDark]);

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
    >
      {/* Search Input */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
            borderRadius: 10,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: isDark ? "#334155" : "#e2e8f0",
          }}
        >
          <Text style={{ fontSize: 16, color: isDark ? "#64748b" : "#94a3b8", marginRight: 8 }}>
            {"()"}
          </Text>
          <TextInput
            testID="search-input"
            value={query}
            onChangeText={setQuery}
            placeholder="Search books by title, author, ISBN..."
            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            style={{
              flex: 1,
              paddingVertical: 10,
              fontSize: 15,
              color: isDark ? "#f8fafc" : "#1a1a1a",
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              testID="clear-search"
              onPress={() => setQuery("")}
              style={{ padding: 4 }}
            >
              <Text style={{ fontSize: 14, color: isDark ? "#64748b" : "#94a3b8" }}>X</Text>
            </Pressable>
          )}
        </View>

        {/* Tagged Search Indicator */}
        {isTagged && (
          <View
            testID="tagged-search-indicator"
            style={{
              marginTop: 8,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "#312e81" : "#eef2ff",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isDark ? "#a5b4fc" : "#4338ca",
              }}
            >
              Tagged search: {taggedProvider ?? query.match(TAG_PATTERN)?.[1]?.toLowerCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Loading Spinner */}
      {isLoading && (
        <View style={{ padding: 20, alignItems: "center" }}>
          <ActivityIndicator
            testID="search-loading"
            size="large"
            color={isDark ? "#60a5fa" : "#3b82f6"}
          />
        </View>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <View
          testID="search-error"
          style={{
            padding: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#fca5a5" : "#991b1b",
              marginBottom: 12,
            }}
          >
            Failed to search. Please try again.
          </Text>
          <Pressable
            testID="retry-button"
            onPress={() => refetch()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: "#3b82f6",
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600" }}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Results List */}
      {!isLoading && !isError && (
        <FlatList
          testID="search-results-list"
          data={books}
          renderItem={renderResult}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}
