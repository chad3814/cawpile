import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getFacetConfig,
  calculateCawpileAverage,
  getCawpileGrade,
  getCawpileColor,
  convertToStars,
  RATING_SCALE_GUIDE,
} from "@cawpile/shared";
import type { CawpileFacet, CawpileRating, CawpileSemanticColor, BookType } from "@cawpile/shared";
import { useSubmitRating } from "@/hooks/mutations/useSubmitRating";

const SEMANTIC_COLORS: Record<CawpileSemanticColor, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface RatingState {
  characters: number | null;
  atmosphere: number | null;
  writing: number | null;
  plot: number | null;
  intrigue: number | null;
  logic: number | null;
  enjoyment: number | null;
}

export default function RateBookScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    bookType: string;
    existingRating: string;
  }>();

  const bookType = (params.bookType || "FICTION") as BookType;
  const facets = getFacetConfig(bookType);
  const submitRating = useSubmitRating(params.id);

  const existingRating: CawpileRating | null = useMemo(() => {
    try {
      return params.existingRating
        ? (JSON.parse(params.existingRating) as CawpileRating)
        : null;
    } catch {
      return null;
    }
  }, [params.existingRating]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<RatingState>({
    characters: existingRating?.characters ?? 5,
    atmosphere: existingRating?.atmosphere ?? 5,
    writing: existingRating?.writing ?? 5,
    plot: existingRating?.plot ?? 5,
    intrigue: existingRating?.intrigue ?? 5,
    logic: existingRating?.logic ?? 5,
    enjoyment: existingRating?.enjoyment ?? 5,
  });

  const isSummary = currentIndex === facets.length;
  const currentFacet = isSummary ? null : facets[currentIndex];

  const updateRating = useCallback((key: keyof RatingState, value: number | null) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goNext = useCallback(() => {
    if (currentIndex < facets.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, facets.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const skipFacet = useCallback(() => {
    if (currentFacet) {
      updateRating(currentFacet.key as keyof RatingState, null);
      goNext();
    }
  }, [currentFacet, updateRating, goNext]);

  const jumpToSummary = useCallback(() => {
    setCurrentIndex(facets.length);
  }, [facets.length]);

  const handleSubmit = useCallback(() => {
    submitRating.mutate(ratings, {
      onSuccess: () => {
        router.back();
      },
    });
  }, [ratings, submitRating, router]);

  const average = calculateCawpileAverage(ratings);
  const grade = getCawpileGrade(average);
  const stars = convertToStars(average);

  // Render facet card
  if (!isSummary && currentFacet) {
    const facetKey = currentFacet.key as keyof RatingState;
    const currentValue = ratings[facetKey];

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Progress indicator */}
        <View style={{ flexDirection: "row", gap: 4, marginBottom: 20 }}>
          {facets.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: i <= currentIndex
                  ? "#3b82f6"
                  : (isDark ? "#334155" : "#e2e8f0"),
              }}
            />
          ))}
        </View>

        <Text
          style={{
            fontSize: 12,
            color: isDark ? "#94a3b8" : "#64748b",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {currentIndex + 1} of {facets.length}
        </Text>

        {/* Facet Card */}
        <View
          testID={`facet-card-${facetKey}`}
          style={{
            backgroundColor: isDark ? "#1e293b" : "#f8fafc",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <Text
            testID={`facet-name-${facetKey}`}
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {currentFacet.name}
          </Text>

          <Text
            testID={`facet-description-${facetKey}`}
            style={{
              fontSize: 14,
              color: isDark ? "#94a3b8" : "#64748b",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {currentFacet.description}
          </Text>

          {/* Guiding Questions */}
          <View style={{ marginBottom: 24 }}>
            {currentFacet.questions.map((q, i) => (
              <Text
                key={i}
                style={{
                  fontSize: 13,
                  color: isDark ? "#cbd5e1" : "#475569",
                  marginBottom: 4,
                  lineHeight: 20,
                }}
              >
                {"\u2022"} {q}
              </Text>
            ))}
          </View>

          {/* Value Display */}
          <Text
            testID={`facet-value-${facetKey}`}
            style={{
              fontSize: 56,
              fontWeight: "bold",
              color: currentValue !== null
                ? SEMANTIC_COLORS[getCawpileColor(currentValue)]
                : (isDark ? "#64748b" : "#94a3b8"),
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {currentValue !== null ? currentValue : "-"}
          </Text>

          {currentValue !== null && (
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#94a3b8" : "#64748b",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {RATING_SCALE_GUIDE.find((g) => g.value === currentValue)?.label ?? ""}
            </Text>
          )}

          {/* Slider (1-10) */}
          <View style={{ flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
              <Pressable
                key={val}
                testID={`slider-value-${val}`}
                onPress={() => updateRating(facetKey, val)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: currentValue === val
                    ? SEMANTIC_COLORS[getCawpileColor(val)]
                    : (isDark ? "#334155" : "#e2e8f0"),
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: currentValue === val
                      ? "#ffffff"
                      : (isDark ? "#94a3b8" : "#475569"),
                  }}
                >
                  {val}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          {currentIndex > 0 ? (
            <Pressable
              testID="prev-button"
              onPress={goPrev}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: isDark ? "#94a3b8" : "#475569" }}>
                Previous
              </Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <Pressable
            testID="skip-button"
            onPress={skipFacet}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 13, color: isDark ? "#64748b" : "#94a3b8" }}>
              Skip
            </Text>
          </Pressable>

          <Pressable
            testID="next-button"
            onPress={goNext}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: "#3b82f6",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#ffffff" }}>
              Next
            </Text>
          </Pressable>
        </View>

        {/* Jump to Summary */}
        <Pressable
          testID="jump-to-summary"
          onPress={jumpToSummary}
          style={{ marginTop: 12, alignItems: "center", paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 13, color: "#3b82f6", fontWeight: "600" }}>
            Jump to Summary
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Render Summary
  return (
    <ScrollView
      testID="rating-summary"
      style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          color: isDark ? "#f8fafc" : "#1a1a1a",
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        Rating Summary
      </Text>

      {/* Average, Grade, Stars */}
      <View style={{ alignItems: "center", marginBottom: 24, marginTop: 16 }}>
        <Text
          testID="summary-average"
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: average > 0 ? SEMANTIC_COLORS[getCawpileColor(average)] : (isDark ? "#64748b" : "#94a3b8"),
          }}
        >
          {average > 0 ? average.toFixed(1) : "-"}
        </Text>
        <Text
          testID="summary-grade"
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: isDark ? "#e2e8f0" : "#334155",
            marginTop: 4,
          }}
        >
          {average > 0 ? grade : "No Rating"}
        </Text>
        <Text
          testID="summary-stars"
          style={{
            fontSize: 16,
            color: isDark ? "#94a3b8" : "#64748b",
            marginTop: 4,
          }}
        >
          {"*".repeat(stars)}{"_".repeat(5 - stars)}
        </Text>
      </View>

      {/* Facet Breakdown */}
      <View
        style={{
          backgroundColor: isDark ? "#1e293b" : "#f8fafc",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        {facets.map((facet) => {
          const value = ratings[facet.key as keyof RatingState];
          return (
            <Pressable
              key={facet.key}
              testID={`summary-facet-${facet.key}`}
              onPress={() => setCurrentIndex(facets.indexOf(facet))}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth: facets.indexOf(facet) < facets.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? "#334155" : "#e2e8f0",
              }}
            >
              <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155", flex: 1 }}>
                {facet.name}
              </Text>
              {value !== null ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 60,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: isDark ? "#334155" : "#e2e8f0",
                      marginRight: 8,
                    }}
                  >
                    <View
                      style={{
                        width: `${(value / 10) * 100}%`,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: SEMANTIC_COLORS[getCawpileColor(value)],
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: SEMANTIC_COLORS[getCawpileColor(value)],
                      width: 24,
                      textAlign: "right",
                    }}
                  >
                    {value}
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    fontStyle: "italic",
                    color: isDark ? "#64748b" : "#94a3b8",
                  }}
                >
                  Skipped
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Submit Button */}
      <Pressable
        testID="submit-rating-button"
        onPress={handleSubmit}
        disabled={submitRating.isPending}
        style={({ pressed }) => ({
          paddingVertical: 14,
          borderRadius: 10,
          backgroundColor: pressed ? "#2563eb" : "#3b82f6",
          alignItems: "center",
          opacity: submitRating.isPending ? 0.6 : 1,
        })}
      >
        {submitRating.isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
            Submit Rating
          </Text>
        )}
      </Pressable>

      {/* Back to editing */}
      <Pressable
        testID="back-to-editing"
        onPress={() => setCurrentIndex(0)}
        style={{ marginTop: 12, alignItems: "center", paddingVertical: 8 }}
      >
        <Text style={{ fontSize: 13, color: "#3b82f6" }}>
          Back to editing
        </Text>
      </Pressable>
    </ScrollView>
  );
}
