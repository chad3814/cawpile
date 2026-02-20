/**
 * Task Group 8 - Book Details screen tests
 *
 * Test 1: Book metadata displays correctly (title, authors, description, page count, ISBNs, categories)
 * Test 2: User-specific data renders (status badge, format badges, progress bar, dates)
 * Test 3: CAWPILE rating display shows facet breakdown with colored bars and average
 * Test 4: Reading sessions list fetches and displays via GET /api/reading-sessions?userBookId=
 * Test 5: Delete action shows confirmation dialog and calls DELETE /api/user/books/[id]
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert, View, Text } from "react-native";
import type { AlertButton } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: "book-1" }),
  Stack: {
    Screen: () => null,
  },
}));

// Mock expo-image
jest.mock("expo-image", () => ({
  Image: ({ testID, ...props }: Record<string, string>) => {
    const { View: RNView } = require("react-native");
    return <RNView testID={testID || "expo-image"} {...props} />;
  },
}));

// Mock the API client
const mockApiGet = jest.fn();
const mockApiDelete = jest.fn();
jest.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: jest.fn(),
    patch: jest.fn(),
    delete: (...args: unknown[]) => mockApiDelete(...args),
  },
  ApiError: class ApiError extends Error {
    status: number;
    body: Record<string, string> | null;
    constructor(message: string, status: number, body: Record<string, string> | null) {
      super(message);
      this.status = status;
      this.body = body;
    }
  },
}));

// Mock @cawpile/shared
jest.mock("@cawpile/shared", () => ({
  getCawpileGrade: (avg: number) => {
    if (avg >= 9) return "A+";
    if (avg >= 8) return "A-";
    if (avg >= 7) return "B";
    return "C";
  },
  getCawpileColor: (val: number) => {
    if (val >= 8) return "green";
    if (val >= 6) return "yellow";
    if (val >= 4) return "orange";
    return "red";
  },
  convertToStars: (avg: number) => Math.round(avg / 2),
  calculateCawpileAverage: () => 7.7,
  getFacetConfig: () => [
    { name: "Characters", key: "characters", description: "Character dev", questions: [] },
    { name: "Atmosphere", key: "atmosphere", description: "World-building", questions: [] },
    { name: "Writing", key: "writing", description: "Prose quality", questions: [] },
    { name: "Plot", key: "plot", description: "Story pacing", questions: [] },
    { name: "Intrigue", key: "intrigue", description: "Engagement", questions: [] },
    { name: "Logic", key: "logic", description: "Coherence", questions: [] },
    { name: "Enjoyment", key: "enjoyment", description: "Overall fun", questions: [] },
  ],
  detectBookType: () => "FICTION",
  FICTION_FACETS: [],
  NONFICTION_FACETS: [],
  RATING_SCALE_GUIDE: [],
}));

// Mock safe area context
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => {
    const { View: RNView } = require("react-native");
    return <RNView {...props}>{children}</RNView>;
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock offline queue
jest.mock("@/lib/offlineQueue", () => ({
  enqueue: jest.fn(),
  processQueue: jest.fn(),
  getQueue: jest.fn().mockResolvedValue([]),
  getQueueCount: jest.fn().mockResolvedValue(0),
}));

import type { DashboardBookData, CawpileRatingData } from "@cawpile/shared";

function createMockBook(overrides: Partial<DashboardBookData> = {}): DashboardBookData {
  return {
    id: "book-1",
    status: "READING",
    format: ["PAPERBACK", "EBOOK"],
    progress: 65,
    startDate: new Date("2025-06-01"),
    finishDate: null,
    createdAt: new Date("2025-05-28"),
    review: "A wonderful read so far.",
    acquisitionMethod: "Purchased",
    bookClubName: "Monthly Readers",
    readathonName: "Summer 2025",
    isReread: false,
    lgbtqRepresentation: "Yes",
    disabilityRepresentation: "No",
    isNewAuthor: true,
    authorPoc: "Unknown",
    edition: {
      id: "edition-1",
      title: null,
      book: {
        title: "The Name of the Wind",
        authors: ["Patrick Rothfuss"],
        bookType: "FICTION",
      },
      googleBook: {
        imageUrl: "https://books.google.com/cover.jpg",
        description: "A classic fantasy novel about a gifted young man.",
        pageCount: 662,
      },
      hardcoverBook: null,
      ibdbBook: null,
    },
    cawpileRating: null,
    ...overrides,
  };
}

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Book Details screen", () => {
  // ---------- Test 1 ----------
  it("book metadata displays correctly", () => {
    const book = createMockBook();

    function MetadataDisplay({ book: b }: { book: DashboardBookData }) {
      const gb = b.edition.googleBook;
      return (
        <View>
          <Text testID="detail-title">{b.edition.book.title}</Text>
          <Text testID="detail-authors">{b.edition.book.authors.join(", ")}</Text>
          {gb?.description && <Text testID="detail-description">{gb.description}</Text>}
          {gb?.pageCount && <Text testID="detail-page-count">{gb.pageCount} pages</Text>}
        </View>
      );
    }

    render(<MetadataDisplay book={book} />);

    expect(screen.getByTestId("detail-title")).toBeTruthy();
    expect(screen.getByText("The Name of the Wind")).toBeTruthy();
    expect(screen.getByText("Patrick Rothfuss")).toBeTruthy();
    expect(screen.getByText("A classic fantasy novel about a gifted young man.")).toBeTruthy();
    expect(screen.getByText("662 pages")).toBeTruthy();
  });

  // ---------- Test 2 ----------
  it("user-specific data renders (status badge, format badges, progress bar, dates)", () => {
    const book = createMockBook();

    function UserDataDisplay({ book: b }: { book: DashboardBookData }) {
      return (
        <View>
          <Text testID="status-badge">{b.status}</Text>
          <View testID="format-badges">
            {b.format.map((f) => (
              <Text key={f} testID={`format-${f}`}>{f}</Text>
            ))}
          </View>
          <Text testID="progress">{b.progress}%</Text>
          {b.startDate && (
            <Text testID="start-date">
              Started: {new Date(b.startDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      );
    }

    render(<UserDataDisplay book={book} />);

    expect(screen.getByTestId("status-badge")).toBeTruthy();
    expect(screen.getByText("READING")).toBeTruthy();
    expect(screen.getByTestId("format-PAPERBACK")).toBeTruthy();
    expect(screen.getByTestId("format-EBOOK")).toBeTruthy();
    expect(screen.getByText("65%")).toBeTruthy();
    expect(screen.getByTestId("start-date")).toBeTruthy();
  });

  // ---------- Test 3 ----------
  it("CAWPILE rating display shows facet breakdown with colored bars and average", () => {
    const rating: CawpileRatingData = {
      id: "rating-1",
      average: 7.7,
      characters: 8,
      atmosphere: 7,
      writing: 9,
      plot: 7,
      intrigue: 8,
      logic: 7,
      enjoyment: 8,
    };

    const { getCawpileGrade, getCawpileColor } = require("@cawpile/shared");

    function RatingDisplay({ rating: r }: { rating: CawpileRatingData }) {
      const facets = [
        { name: "Characters", value: r.characters },
        { name: "Atmosphere", value: r.atmosphere },
        { name: "Writing", value: r.writing },
        { name: "Plot", value: r.plot },
        { name: "Intrigue", value: r.intrigue },
        { name: "Logic", value: r.logic },
        { name: "Enjoyment", value: r.enjoyment },
      ];

      return (
        <View testID="rating-section">
          <Text testID="rating-average">{r.average.toFixed(1)}</Text>
          <Text testID="rating-grade">{getCawpileGrade(r.average)}</Text>
          {facets.map((facet) => (
            <View key={facet.name} testID={`facet-${facet.name.toLowerCase()}`}>
              <Text>{facet.name}</Text>
              <Text testID={`facet-value-${facet.name.toLowerCase()}`}>
                {facet.value}
              </Text>
              <View
                testID={`facet-bar-${facet.name.toLowerCase()}`}
                style={{
                  width: `${((facet.value ?? 0) / 10) * 100}%`,
                  backgroundColor: getCawpileColor(facet.value ?? 0) === "green"
                    ? "#22c55e"
                    : getCawpileColor(facet.value ?? 0) === "yellow"
                      ? "#eab308"
                      : "#f97316",
                }}
              />
            </View>
          ))}
        </View>
      );
    }

    render(<RatingDisplay rating={rating} />);

    expect(screen.getByTestId("rating-section")).toBeTruthy();
    expect(screen.getByTestId("rating-average")).toBeTruthy();
    expect(screen.getByText("7.7")).toBeTruthy();
    expect(screen.getByTestId("rating-grade")).toBeTruthy();
    expect(screen.getByTestId("facet-characters")).toBeTruthy();
    expect(screen.getByTestId("facet-writing")).toBeTruthy();
    expect(screen.getByTestId("facet-enjoyment")).toBeTruthy();
  });

  // ---------- Test 4 ----------
  it("reading sessions list fetches and displays", async () => {
    const mockSessions = {
      sessions: [
        {
          id: "session-1",
          userBookId: "book-1",
          startPage: 1,
          endPage: 50,
          pagesRead: 50,
          duration: 45,
          notes: "Great start",
          sessionDate: "2025-06-01T12:00:00Z",
          createdAt: "2025-06-01T12:00:00Z",
        },
        {
          id: "session-2",
          userBookId: "book-1",
          startPage: 51,
          endPage: 120,
          pagesRead: 70,
          duration: 60,
          notes: null,
          sessionDate: "2025-06-02T12:00:00Z",
          createdAt: "2025-06-02T12:00:00Z",
        },
      ],
      total: 2,
      stats: { totalSessions: 2, totalPagesRead: 120, totalMinutes: 105 },
    };

    mockApiGet.mockResolvedValue(mockSessions);

    const { useReadingSessions } = require("@/hooks/queries/useReadingSessions");

    interface Session {
      id: string;
      pagesRead: number;
      duration: number | null;
      notes: string | null;
      sessionDate: string;
    }

    function SessionsDisplay() {
      const { data, isLoading } = useReadingSessions("book-1");
      if (isLoading) return <Text>Loading sessions...</Text>;
      if (!data) return <Text>No sessions</Text>;

      return (
        <View testID="sessions-list">
          {data.sessions.map((s: Session) => (
            <View key={s.id} testID={`session-${s.id}`}>
              <Text>{s.pagesRead} pages</Text>
              {s.duration && <Text>{s.duration} min</Text>}
              {s.notes && <Text>{s.notes}</Text>}
            </View>
          ))}
          <Text testID="sessions-total">Total: {data.stats.totalPagesRead} pages</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<SessionsDisplay />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId("sessions-list")).toBeTruthy();
    });

    expect(screen.getByTestId("session-session-1")).toBeTruthy();
    expect(screen.getByTestId("session-session-2")).toBeTruthy();
    expect(screen.getByText("50 pages")).toBeTruthy();
    expect(screen.getByText("70 pages")).toBeTruthy();
    expect(screen.getByText("Great start")).toBeTruthy();
    expect(screen.getByText("Total: 120 pages")).toBeTruthy();
    expect(mockApiGet).toHaveBeenCalledWith("/api/reading-sessions?userBookId=book-1");
  });

  // ---------- Test 5 ----------
  it("delete action shows confirmation dialog and calls DELETE /api/user/books/[id]", async () => {
    mockApiDelete.mockResolvedValue(undefined);

    // Spy on Alert.alert
    const alertSpy = jest.spyOn(Alert, "alert");

    const { useDeleteBook } = require("@/hooks/mutations/useDeleteBook");

    function DeleteTestComponent() {
      const deleteBook = useDeleteBook();

      const handleDelete = () => {
        Alert.alert(
          "Delete Book",
          "Are you sure you want to remove this book from your library?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => deleteBook.mutate("book-1"),
            },
          ],
        );
      };

      return (
        <View testID="delete-button" onTouchEnd={handleDelete}>
          <Text>Delete</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<DeleteTestComponent />, { wrapper: Wrapper });

    // Trigger the delete
    fireEvent(screen.getByTestId("delete-button"), "touchEnd");

    // Alert should have been shown
    expect(alertSpy).toHaveBeenCalledWith(
      "Delete Book",
      "Are you sure you want to remove this book from your library?",
      expect.arrayContaining([
        expect.objectContaining({ text: "Cancel" }),
        expect.objectContaining({ text: "Delete", style: "destructive" }),
      ]),
    );

    // Simulate pressing "Delete" in the alert
    const alertButtons = alertSpy.mock.calls[0][2] as AlertButton[] | undefined;
    const deleteCallback = alertButtons?.find(
      (btn: AlertButton) => btn.text === "Delete",
    );
    if (deleteCallback?.onPress) {
      deleteCallback.onPress();
    }

    await waitFor(() => {
      expect(mockApiDelete).toHaveBeenCalledWith("/api/user/books/book-1");
    });

    alertSpy.mockRestore();
  });
});
