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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useUpdateBook } from "@/hooks/mutations/useUpdateBook";
import { useBookClubs } from "@/hooks/queries/useBookClubs";
import { useReadathons } from "@/hooks/queries/useReadathons";
import type { BookFormat, BookStatus, DashboardBookData } from "@cawpile/shared";

const STATUS_OPTIONS: { label: string; value: BookStatus }[] = [
  { label: "Want to Read", value: "WANT_TO_READ" },
  { label: "Currently Reading", value: "READING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "DNF", value: "DNF" },
];

const FORMAT_OPTIONS: { label: string; value: BookFormat }[] = [
  { label: "Hardcover", value: "HARDCOVER" },
  { label: "Paperback", value: "PAPERBACK" },
  { label: "E-book", value: "EBOOK" },
  { label: "Audiobook", value: "AUDIOBOOK" },
];

const REPRESENTATION_OPTIONS = ["Yes", "No", "Unknown"];

export default function EditBookModal() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; bookData: string }>();

  const bookData: DashboardBookData | null = useMemo(() => {
    try {
      return params.bookData
        ? (JSON.parse(params.bookData) as DashboardBookData)
        : null;
    } catch {
      return null;
    }
  }, [params.bookData]);

  const updateBook = useUpdateBook(params.id);
  const { data: bookClubs } = useBookClubs();
  const { data: readathons } = useReadathons();

  // Form state initialized from book data
  const [status, setStatus] = useState<BookStatus>(bookData?.status ?? "READING");
  const [format, setFormat] = useState<BookFormat[]>(bookData?.format ?? []);
  const [startDate, setStartDate] = useState(
    bookData?.startDate ? new Date(bookData.startDate).toISOString().split("T")[0] : "",
  );
  const [finishDate, setFinishDate] = useState(
    bookData?.finishDate ? new Date(bookData.finishDate).toISOString().split("T")[0] : "",
  );
  const [progress, setProgress] = useState(String(bookData?.progress ?? 0));
  const [currentPage, setCurrentPage] = useState("");
  const [review, setReview] = useState(bookData?.review ?? "");
  const [acquisitionMethod, setAcquisitionMethod] = useState(bookData?.acquisitionMethod ?? "");
  const [bookClubName, setBookClubName] = useState(bookData?.bookClubName ?? "");
  const [readathonName, setReadathonName] = useState(bookData?.readathonName ?? "");
  const [isReread, setIsReread] = useState(bookData?.isReread ?? false);
  const [dnfReason, setDnfReason] = useState(bookData?.dnfReason ?? "");
  const [lgbtqRepresentation, setLgbtqRepresentation] = useState(bookData?.lgbtqRepresentation ?? "");
  const [disabilityRepresentation, setDisabilityRepresentation] = useState(bookData?.disabilityRepresentation ?? "");
  const [isNewAuthor, setIsNewAuthor] = useState(bookData?.isNewAuthor ?? false);
  const [authorPoc, setAuthorPoc] = useState(bookData?.authorPoc ?? "");

  const [showBookClubSuggestions, setShowBookClubSuggestions] = useState(false);
  const [showReadathonSuggestions, setShowReadathonSuggestions] = useState(false);

  const toggleFormat = useCallback((f: BookFormat) => {
    setFormat((prev) =>
      prev.includes(f)
        ? prev.filter((fmt) => fmt !== f)
        : [...prev, f],
    );
  }, []);

  const handleSave = useCallback(() => {
    const changes: Record<string, unknown> = {};

    if (status !== bookData?.status) changes.status = status;
    if (JSON.stringify(format) !== JSON.stringify(bookData?.format)) changes.format = format;
    if (startDate !== (bookData?.startDate ? new Date(bookData.startDate).toISOString().split("T")[0] : "")) {
      changes.startDate = startDate || null;
    }
    if (finishDate !== (bookData?.finishDate ? new Date(bookData.finishDate).toISOString().split("T")[0] : "")) {
      changes.finishDate = finishDate || null;
    }
    const progressNum = parseInt(progress, 10);
    if (!isNaN(progressNum) && progressNum !== (bookData?.progress ?? 0)) {
      changes.progress = progressNum;
    }
    if (review !== (bookData?.review ?? "")) changes.review = review || null;
    if (acquisitionMethod !== (bookData?.acquisitionMethod ?? "")) changes.acquisitionMethod = acquisitionMethod || null;
    if (bookClubName !== (bookData?.bookClubName ?? "")) changes.bookClubName = bookClubName || null;
    if (readathonName !== (bookData?.readathonName ?? "")) changes.readathonName = readathonName || null;
    if (isReread !== (bookData?.isReread ?? false)) changes.isReread = isReread;
    if (dnfReason !== (bookData?.dnfReason ?? "")) changes.dnfReason = dnfReason || null;
    if (lgbtqRepresentation !== (bookData?.lgbtqRepresentation ?? "")) changes.lgbtqRepresentation = lgbtqRepresentation || null;
    if (disabilityRepresentation !== (bookData?.disabilityRepresentation ?? "")) changes.disabilityRepresentation = disabilityRepresentation || null;
    if (isNewAuthor !== (bookData?.isNewAuthor ?? false)) changes.isNewAuthor = isNewAuthor;
    if (authorPoc !== (bookData?.authorPoc ?? "")) changes.authorPoc = authorPoc || null;

    // Only submit if there are actual changes
    if (Object.keys(changes).length === 0) {
      router.back();
      return;
    }

    updateBook.mutate(changes as Parameters<typeof updateBook.mutate>[0], {
      onSuccess: () => {
        router.back();
      },
    });
  }, [
    status, format, startDate, finishDate, progress, review,
    acquisitionMethod, bookClubName, readathonName, isReread,
    dnfReason, lgbtqRepresentation, disabilityRepresentation,
    isNewAuthor, authorPoc, bookData, updateBook, router,
  ]);

  const filteredBookClubs = bookClubs?.filter(
    (bc) => bc.name.toLowerCase().includes(bookClubName.toLowerCase()),
  ) ?? [];

  const filteredReadathons = readathons?.filter(
    (ra) => ra.name.toLowerCase().includes(readathonName.toLowerCase()),
  ) ?? [];

  if (!bookData) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: isDark ? "#94a3b8" : "#64748b" }}>No book data provided.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      testID="edit-book-scroll"
      style={{ flex: 1, backgroundColor: isDark ? "#0f172a" : "#ffffff" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
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
        Edit Book
      </Text>

      {/* Status */}
      <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 8 }}>
        Status
      </Text>
      {STATUS_OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          testID={`edit-status-${option.value}`}
          onPress={() => setStatus(option.value)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
            paddingHorizontal: 12,
            marginBottom: 4,
            borderRadius: 8,
            backgroundColor: status === option.value ? (isDark ? "#1e3a5f" : "#dbeafe") : "transparent",
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 2,
              borderColor: status === option.value ? "#3b82f6" : (isDark ? "#475569" : "#cbd5e1"),
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            {status === option.value && (
              <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#3b82f6" }} />
            )}
          </View>
          <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>
            {option.label}
          </Text>
        </Pressable>
      ))}

      {/* Format Multi-Select */}
      <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#f8fafc" : "#1a1a1a", marginTop: 16, marginBottom: 8 }}>
        Format
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {FORMAT_OPTIONS.map((option) => {
          const isSelected = format.includes(option.value);
          return (
            <Pressable
              key={option.value}
              testID={`edit-format-${option.value}`}
              onPress={() => toggleFormat(option.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isSelected ? "#3b82f6" : (isDark ? "#475569" : "#cbd5e1"),
                backgroundColor: isSelected ? (isDark ? "#1e3a5f" : "#dbeafe") : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? "600" : "400",
                  color: isSelected ? "#3b82f6" : (isDark ? "#94a3b8" : "#475569"),
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Start Date */}
      <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 8 }}>
        Start Date
      </Text>
      <TextInput
        testID="edit-start-date"
        value={startDate}
        onChangeText={setStartDate}
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
          marginBottom: 16,
        }}
      />

      {/* Finish Date (Completed/DNF) */}
      {(status === "COMPLETED" || status === "DNF") && (
        <>
          <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 8 }}>
            Finish Date
          </Text>
          <TextInput
            testID="edit-finish-date"
            value={finishDate}
            onChangeText={setFinishDate}
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
              marginBottom: 16,
            }}
          />
        </>
      )}

      {/* Progress (Reading) */}
      {status === "READING" && (
        <>
          <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 8 }}>
            Progress (%)
          </Text>
          <TextInput
            testID="edit-progress"
            value={progress}
            onChangeText={(text) => {
              const val = parseInt(text, 10);
              if (!isNaN(val) && val >= 0 && val <= 100) {
                setProgress(String(val));
              } else if (text === "") {
                setProgress("0");
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
              marginBottom: 16,
            }}
          />
        </>
      )}

      {/* DNF Reason */}
      {status === "DNF" && (
        <>
          <Text style={{ fontSize: 15, fontWeight: "600", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 8 }}>
            DNF Reason (optional)
          </Text>
          <TextInput
            testID="edit-dnf-reason"
            value={dnfReason}
            onChangeText={setDnfReason}
            placeholder="Why did you stop reading?"
            placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
            multiline
            style={{
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: isDark ? "#f8fafc" : "#1a1a1a",
              marginBottom: 16,
              minHeight: 60,
              textAlignVertical: "top",
            }}
          />
        </>
      )}

      {/* Tracking Fields */}
      <Text style={{ fontSize: 17, fontWeight: "bold", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 8, marginTop: 8 }}>
        Tracking
      </Text>

      {/* Acquisition Method */}
      <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>
        Acquisition Method
      </Text>
      <TextInput
        testID="edit-acquisition-method"
        value={acquisitionMethod}
        onChangeText={setAcquisitionMethod}
        placeholder="e.g., Purchased, Library, Gift"
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
          marginBottom: 12,
        }}
      />

      {/* Book Club */}
      <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>
        Book Club
      </Text>
      <TextInput
        testID="edit-book-club"
        value={bookClubName}
        onChangeText={(text) => {
          setBookClubName(text);
          setShowBookClubSuggestions(text.length > 0);
        }}
        onBlur={() => setTimeout(() => setShowBookClubSuggestions(false), 200)}
        placeholder="Book club name"
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
        <View style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderWidth: 1, borderColor: isDark ? "#334155" : "#e2e8f0", borderRadius: 6, marginBottom: 8 }}>
          {filteredBookClubs.slice(0, 5).map((bc) => (
            <Pressable
              key={bc.id}
              onPress={() => { setBookClubName(bc.name); setShowBookClubSuggestions(false); }}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? "#334155" : "#f1f5f9" }}
            >
              <Text style={{ fontSize: 13, color: isDark ? "#e2e8f0" : "#334155" }}>{bc.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Readathon */}
      <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6, marginTop: 4 }}>
        Readathon
      </Text>
      <TextInput
        testID="edit-readathon"
        value={readathonName}
        onChangeText={(text) => {
          setReadathonName(text);
          setShowReadathonSuggestions(text.length > 0);
        }}
        onBlur={() => setTimeout(() => setShowReadathonSuggestions(false), 200)}
        placeholder="Readathon name"
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
        <View style={{ backgroundColor: isDark ? "#1e293b" : "#ffffff", borderWidth: 1, borderColor: isDark ? "#334155" : "#e2e8f0", borderRadius: 6, marginBottom: 8 }}>
          {filteredReadathons.slice(0, 5).map((ra) => (
            <Pressable
              key={ra.id}
              onPress={() => { setReadathonName(ra.name); setShowReadathonSuggestions(false); }}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: isDark ? "#334155" : "#f1f5f9" }}
            >
              <Text style={{ fontSize: 13, color: isDark ? "#e2e8f0" : "#334155" }}>{ra.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Reread Toggle */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 16 }}>
        <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>Reread</Text>
        <Switch
          testID="edit-reread"
          value={isReread}
          onValueChange={setIsReread}
          trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
        />
      </View>

      {/* Diversity Fields */}
      <Text style={{ fontSize: 17, fontWeight: "bold", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 8, marginTop: 8 }}>
        Diversity
      </Text>

      {/* LGBTQ Representation */}
      <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>
        LGBTQ+ Representation
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        {REPRESENTATION_OPTIONS.map((option) => (
          <Pressable
            key={`lgbtq-${option}`}
            testID={`edit-lgbtq-${option.toLowerCase()}`}
            onPress={() => setLgbtqRepresentation(lgbtqRepresentation === option ? "" : option)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: lgbtqRepresentation === option ? "#3b82f6" : (isDark ? "#475569" : "#cbd5e1"),
              backgroundColor: lgbtqRepresentation === option ? (isDark ? "#1e3a5f" : "#dbeafe") : "transparent",
            }}
          >
            <Text style={{ fontSize: 13, color: lgbtqRepresentation === option ? "#3b82f6" : (isDark ? "#94a3b8" : "#475569") }}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Disability Representation */}
      <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>
        Disability Representation
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        {REPRESENTATION_OPTIONS.map((option) => (
          <Pressable
            key={`disability-${option}`}
            testID={`edit-disability-${option.toLowerCase()}`}
            onPress={() => setDisabilityRepresentation(disabilityRepresentation === option ? "" : option)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: disabilityRepresentation === option ? "#3b82f6" : (isDark ? "#475569" : "#cbd5e1"),
              backgroundColor: disabilityRepresentation === option ? (isDark ? "#1e3a5f" : "#dbeafe") : "transparent",
            }}
          >
            <Text style={{ fontSize: 13, color: disabilityRepresentation === option ? "#3b82f6" : (isDark ? "#94a3b8" : "#475569") }}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* New Author Toggle */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={{ fontSize: 14, color: isDark ? "#e2e8f0" : "#334155" }}>New Author</Text>
        <Switch
          testID="edit-new-author"
          value={isNewAuthor}
          onValueChange={setIsNewAuthor}
          trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
        />
      </View>

      {/* Author POC */}
      <Text style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#94a3b8" : "#64748b", marginBottom: 6 }}>
        Author POC
      </Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {REPRESENTATION_OPTIONS.map((option) => (
          <Pressable
            key={`poc-${option}`}
            testID={`edit-poc-${option.toLowerCase()}`}
            onPress={() => setAuthorPoc(authorPoc === option ? "" : option)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: authorPoc === option ? "#3b82f6" : (isDark ? "#475569" : "#cbd5e1"),
              backgroundColor: authorPoc === option ? (isDark ? "#1e3a5f" : "#dbeafe") : "transparent",
            }}
          >
            <Text style={{ fontSize: 13, color: authorPoc === option ? "#3b82f6" : (isDark ? "#94a3b8" : "#475569") }}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Review */}
      <Text style={{ fontSize: 17, fontWeight: "bold", color: isDark ? "#f8fafc" : "#1a1a1a", marginBottom: 8, marginTop: 8 }}>
        Review
      </Text>
      <TextInput
        testID="edit-review"
        value={review}
        onChangeText={setReview}
        placeholder="Write your review..."
        placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
        multiline
        numberOfLines={6}
        style={{
          backgroundColor: isDark ? "#1e293b" : "#f8fafc",
          borderWidth: 1,
          borderColor: isDark ? "#334155" : "#e2e8f0",
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: isDark ? "#f8fafc" : "#1a1a1a",
          minHeight: 120,
          textAlignVertical: "top",
          marginBottom: 24,
        }}
      />

      {/* Save Button */}
      <Pressable
        testID="edit-save-button"
        onPress={handleSave}
        disabled={updateBook.isPending}
        style={({ pressed }) => ({
          paddingVertical: 14,
          borderRadius: 10,
          backgroundColor: pressed ? "#2563eb" : "#3b82f6",
          alignItems: "center",
          opacity: updateBook.isPending ? 0.6 : 1,
        })}
      >
        {updateBook.isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#ffffff" }}>
            Save Changes
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
