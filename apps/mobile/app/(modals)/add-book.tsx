import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  useColorScheme,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useAddBook } from "@/hooks/mutations/useAddBook";
import { useBookClubs } from "@/hooks/queries/useBookClubs";
import { useReadathons } from "@/hooks/queries/useReadathons";
import { AcquisitionMethod } from "@cawpile/shared";
import type { BookFormat, BookStatus } from "@cawpile/shared";
import type { SignedBookSearchResult } from "@/hooks/queries/useBookSearch";

type WizardStatus = "WANT_TO_READ" | "READING" | "COMPLETED";

interface FormData {
  status: WizardStatus;
  format: BookFormat[];
  startDate: string;
  finishDate: string;
  dnfDate: string;
  progress: number;
  didFinish: boolean | null;
  acquisitionMethod: string | null;
  acquisitionOther: string;
  bookClubName: string;
  readathonName: string;
  isReread: boolean;
}

const FORMAT_OPTIONS: { label: string; value: BookFormat }[] = [
  { label: "Hardcover", value: "HARDCOVER" },
  { label: "Paperback", value: "PAPERBACK" },
  { label: "E-book", value: "EBOOK" },
  { label: "Audiobook", value: "AUDIOBOOK" },
];

const STATUS_OPTIONS: { label: string; value: WizardStatus }[] = [
  { label: "Want to Read", value: "WANT_TO_READ" },
  { label: "Currently Reading", value: "READING" },
  { label: "Completed", value: "COMPLETED" },
];

const ACQUISITION_OPTIONS = Object.values(AcquisitionMethod);

function getTotalSteps(status: WizardStatus): number {
  if (status === "WANT_TO_READ") return 2;
  return 4; // READING and COMPLETED
}

export default function AddBookWizard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<{ signedResult: string }>();

  const signedResult: SignedBookSearchResult | null = useMemo(() => {
    try {
      return params.signedResult
        ? (JSON.parse(params.signedResult) as SignedBookSearchResult)
        : null;
    } catch {
      return null;
    }
  }, [params.signedResult]);

  const addBookMutation = useAddBook();
  const { data: bookClubs } = useBookClubs();
  const { data: readathons } = useReadathons();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    status: "WANT_TO_READ",
    format: [],
    startDate: new Date().toISOString().split("T")[0],
    finishDate: new Date().toISOString().split("T")[0],
    dnfDate: new Date().toISOString().split("T")[0],
    progress: 0,
    didFinish: null,
    acquisitionMethod: null,
    acquisitionOther: "",
    bookClubName: "",
    readathonName: "",
    isReread: false,
  });

  const [showBookClubSuggestions, setShowBookClubSuggestions] = useState(false);
  const [showReadathonSuggestions, setShowReadathonSuggestions] = useState(false);

  const totalSteps = getTotalSteps(formData.status);

  const toggleFormat = useCallback((format: BookFormat) => {
    setFormData((prev) => ({
      ...prev,
      format: prev.format.includes(format)
        ? prev.format.filter((f) => f !== format)
        : [...prev.format, format],
    }));
  }, []);

  const isStepValid = useCallback((): boolean => {
    if (currentStep === 1) {
      return formData.format.length > 0;
    }
    return true;
  }, [currentStep, formData.format]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  }, [currentStep, totalSteps]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(() => {
    if (!signedResult) return;

    addBookMutation.mutate(
      {
        signedResult,
        status: formData.status,
        format: formData.format,
        startDate: formData.status !== "WANT_TO_READ" ? formData.startDate : undefined,
        finishDate: formData.status === "COMPLETED" && formData.didFinish === true
          ? formData.finishDate
          : undefined,
        dnfDate: formData.status === "COMPLETED" && formData.didFinish === false
          ? formData.dnfDate
          : undefined,
        progress: formData.progress,
        didFinish: formData.didFinish ?? undefined,
        acquisitionMethod: formData.acquisitionMethod,
        acquisitionOther: formData.acquisitionOther || undefined,
        bookClubName: formData.bookClubName || null,
        readathonName: formData.readathonName || null,
        isReread: formData.isReread,
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }, [signedResult, formData, addBookMutation, router]);

  if (!signedResult) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
          No book data provided.
        </Text>
      </View>
    );
  }

  const filteredBookClubs = bookClubs?.filter(
    (bc) => bc.name.toLowerCase().includes(formData.bookClubName.toLowerCase()),
  ) ?? [];

  const filteredReadathons = readathons?.filter(
    (ra) => ra.name.toLowerCase().includes(formData.readathonName.toLowerCase()),
  ) ?? [];

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
      }}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Progress Bar */}
      <View
        testID="wizard-progress"
        style={{
          flexDirection: "row",
          marginBottom: 20,
          gap: 4,
        }}
      >
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < currentStep
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
          marginBottom: 16,
        }}
      >
        Step {currentStep} of {totalSteps}
      </Text>

      {/* Book Info Header */}
      <View
        style={{
          flexDirection: "row",
          marginBottom: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#334155" : "#e2e8f0",
        }}
      >
        {signedResult.imageUrl && (
          <Image
            source={{ uri: signedResult.imageUrl }}
            style={{ width: 40, height: 60, borderRadius: 4, marginRight: 12 }}
            contentFit="cover"
          />
        )}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
            }}
            numberOfLines={2}
          >
            {signedResult.title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#94a3b8" : "#64748b",
              marginTop: 2,
            }}
          >
            {signedResult.authors.join(", ")}
          </Text>
        </View>
      </View>

      {/* Step 1: Status & Format */}
      {currentStep === 1 && (
        <View testID="wizard-step-1">
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginBottom: 12,
            }}
          >
            Reading Status
          </Text>
          {STATUS_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              testID={`status-option-${option.value}`}
              onPress={() => setFormData((prev) => ({ ...prev, status: option.value }))}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 4,
                borderRadius: 8,
                backgroundColor: formData.status === option.value
                  ? (isDark ? "#1e3a5f" : "#dbeafe")
                  : "transparent",
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: formData.status === option.value ? "#3b82f6" : (isDark ? "#475569" : "#cbd5e1"),
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                {formData.status === option.value && (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#3b82f6",
                    }}
                  />
                )}
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? "#e2e8f0" : "#334155",
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}

          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            Format(s) *
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {FORMAT_OPTIONS.map((option) => {
              const isSelected = formData.format.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  testID={`format-option-${option.value}`}
                  onPress={() => toggleFormat(option.value)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isSelected ? "#3b82f6" : (isDark ? "#475569" : "#cbd5e1"),
                    backgroundColor: isSelected
                      ? (isDark ? "#1e3a5f" : "#dbeafe")
                      : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? "600" : "400",
                      color: isSelected
                        ? "#3b82f6"
                        : (isDark ? "#94a3b8" : "#475569"),
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {formData.format.length === 0 && (
            <Text
              style={{
                fontSize: 12,
                color: "#ef4444",
                marginTop: 6,
              }}
            >
              Please select at least one format
            </Text>
          )}
        </View>
      )}

      {/* Step 2: Tracking Fields */}
      {currentStep === 2 && (
        <View testID="wizard-step-2">
          {/* Acquisition Method */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginBottom: 8,
            }}
          >
            How did you get this book?
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 16 }}
          >
            {ACQUISITION_OPTIONS.map((method) => {
              const isSelected = formData.acquisitionMethod === method;
              return (
                <Pressable
                  key={method}
                  onPress={() => setFormData((prev) => ({
                    ...prev,
                    acquisitionMethod: isSelected ? null : method,
                  }))}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isSelected ? "#3b82f6" : (isDark ? "#475569" : "#cbd5e1"),
                    backgroundColor: isSelected
                      ? (isDark ? "#1e3a5f" : "#dbeafe")
                      : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: isSelected ? "#3b82f6" : (isDark ? "#94a3b8" : "#475569"),
                    }}
                  >
                    {method}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Book Club */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginBottom: 8,
            }}
          >
            Book Club (optional)
          </Text>
          <TextInput
            testID="book-club-input"
            value={formData.bookClubName}
            onChangeText={(text) => {
              setFormData((prev) => ({ ...prev, bookClubName: text }));
              setShowBookClubSuggestions(text.length > 0);
            }}
            onBlur={() => setTimeout(() => setShowBookClubSuggestions(false), 200)}
            placeholder="Enter book club name"
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
              marginBottom: 4,
            }}
          />
          {showBookClubSuggestions && filteredBookClubs.length > 0 && (
            <View
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
                borderRadius: 6,
                marginBottom: 8,
                maxHeight: 120,
              }}
            >
              {filteredBookClubs.slice(0, 5).map((bc) => (
                <Pressable
                  key={bc.id}
                  onPress={() => {
                    setFormData((prev) => ({ ...prev, bookClubName: bc.name }));
                    setShowBookClubSuggestions(false);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#334155" : "#f1f5f9",
                  }}
                >
                  <Text style={{ fontSize: 13, color: isDark ? "#e2e8f0" : "#334155" }}>
                    {bc.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Readathon */}
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            Readathon (optional)
          </Text>
          <TextInput
            testID="readathon-input"
            value={formData.readathonName}
            onChangeText={(text) => {
              setFormData((prev) => ({ ...prev, readathonName: text }));
              setShowReadathonSuggestions(text.length > 0);
            }}
            onBlur={() => setTimeout(() => setShowReadathonSuggestions(false), 200)}
            placeholder="Enter readathon name"
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
              marginBottom: 4,
            }}
          />
          {showReadathonSuggestions && filteredReadathons.length > 0 && (
            <View
              style={{
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
                borderRadius: 6,
                marginBottom: 8,
                maxHeight: 120,
              }}
            >
              {filteredReadathons.slice(0, 5).map((ra) => (
                <Pressable
                  key={ra.id}
                  onPress={() => {
                    setFormData((prev) => ({ ...prev, readathonName: ra.name }));
                    setShowReadathonSuggestions(false);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#334155" : "#f1f5f9",
                  }}
                >
                  <Text style={{ fontSize: 13, color: isDark ? "#e2e8f0" : "#334155" }}>
                    {ra.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Reread Toggle */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#f8fafc" : "#1a1a1a",
              }}
            >
              Is this a reread?
            </Text>
            <Switch
              testID="reread-toggle"
              value={formData.isReread}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, isReread: val }))}
              trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
            />
          </View>
        </View>
      )}

      {/* Step 3: Start Date (Reading/Completed only) */}
      {currentStep === 3 && (formData.status === "READING" || formData.status === "COMPLETED") && (
        <View testID="wizard-step-3">
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginBottom: 12,
            }}
          >
            When did you start reading?
          </Text>
          <TextInput
            testID="start-date-input"
            value={formData.startDate}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, startDate: text }))}
            placeholder="YYYY-MM-DD"
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
          <Text
            style={{
              fontSize: 12,
              color: isDark ? "#64748b" : "#94a3b8",
              marginTop: 6,
            }}
          >
            Leave blank if you don't remember
          </Text>
        </View>
      )}

      {/* Step 4: Progress (Reading) or Completion (Completed) */}
      {currentStep === 4 && formData.status === "READING" && (
        <View testID="wizard-step-4-reading">
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginBottom: 12,
            }}
          >
            Current Progress (%)
          </Text>
          <TextInput
            testID="progress-input"
            value={String(formData.progress)}
            onChangeText={(text) => {
              const val = parseInt(text, 10);
              if (!isNaN(val) && val >= 0 && val <= 100) {
                setFormData((prev) => ({ ...prev, progress: val }));
              } else if (text === "") {
                setFormData((prev) => ({ ...prev, progress: 0 }));
              }
            }}
            keyboardType="numeric"
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
      )}

      {currentStep === 4 && formData.status === "COMPLETED" && (
        <View testID="wizard-step-4-completed">
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginBottom: 12,
            }}
          >
            Did you finish reading this book?
          </Text>

          <Pressable
            testID="did-finish-yes"
            onPress={() => setFormData((prev) => ({ ...prev, didFinish: true }))}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginBottom: 4,
              borderRadius: 8,
              backgroundColor: formData.didFinish === true
                ? (isDark ? "#14532d" : "#dcfce7")
                : "transparent",
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: formData.didFinish === true ? "#22c55e" : (isDark ? "#475569" : "#cbd5e1"),
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              {formData.didFinish === true && (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" }} />
              )}
            </View>
            <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>
              Yes, I finished it
            </Text>
          </Pressable>

          <Pressable
            testID="did-finish-no"
            onPress={() => setFormData((prev) => ({ ...prev, didFinish: false }))}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: formData.didFinish === false
                ? (isDark ? "#450a0a" : "#fef2f2")
                : "transparent",
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: formData.didFinish === false ? "#ef4444" : (isDark ? "#475569" : "#cbd5e1"),
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              {formData.didFinish === false && (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444" }} />
              )}
            </View>
            <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>
              No, I did not finish (DNF)
            </Text>
          </Pressable>

          {formData.didFinish === true && (
            <View style={{ marginTop: 16 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: isDark ? "#f8fafc" : "#1a1a1a",
                  marginBottom: 8,
                }}
              >
                When did you finish?
              </Text>
              <TextInput
                testID="finish-date-input"
                value={formData.finishDate}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, finishDate: text }))}
                placeholder="YYYY-MM-DD"
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
          )}

          {formData.didFinish === false && (
            <View style={{ marginTop: 16 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: isDark ? "#f8fafc" : "#1a1a1a",
                  marginBottom: 8,
                }}
              >
                When did you stop reading?
              </Text>
              <TextInput
                testID="dnf-date-input"
                value={formData.dnfDate}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, dnfDate: text }))}
                placeholder="YYYY-MM-DD"
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
          )}
        </View>
      )}

      {/* Navigation Buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 24,
          paddingBottom: 32,
        }}
      >
        {currentStep > 1 ? (
          <Pressable
            testID="wizard-back-button"
            onPress={handleBack}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#94a3b8" : "#475569",
              }}
            >
              Back
            </Text>
          </Pressable>
        ) : (
          <View />
        )}

        <Pressable
          testID="wizard-next-button"
          onPress={handleNext}
          disabled={!isStepValid() || addBookMutation.isPending}
          style={({ pressed }) => ({
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
            backgroundColor: pressed ? "#2563eb" : "#3b82f6",
            opacity: (!isStepValid() || addBookMutation.isPending) ? 0.5 : 1,
          })}
        >
          {addBookMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#ffffff",
              }}
            >
              {currentStep === totalSteps ? "Add Book" : "Next"}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}
