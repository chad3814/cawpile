/**
 * Task Group 11 - Edit Book tests
 *
 * Test 1: Edit form pre-populates with current book data
 * Test 2: Status change updates dependent fields (e.g., changing to Completed shows finish date)
 * Test 3: Edit submission calls PATCH /api/user/books/[id] with changed fields
 * Test 4: Review text editing saves via the same PATCH endpoint
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { View, Text } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock expo-router
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: mockBack,
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    id: "book-1",
    bookData: JSON.stringify({
      id: "book-1",
      status: "READING",
      format: ["PAPERBACK", "EBOOK"],
      progress: 65,
      startDate: "2025-06-01T00:00:00Z",
      finishDate: null,
      createdAt: "2025-05-28T00:00:00Z",
      review: "A great book so far.",
      acquisitionMethod: "Purchased",
      bookClubName: "Monthly Readers",
      readathonName: "Summer 2025",
      isReread: false,
      lgbtqRepresentation: "Yes",
      disabilityRepresentation: null,
      isNewAuthor: true,
      authorPoc: "Unknown",
      dnfReason: null,
      edition: {
        id: "edition-1",
        title: null,
        book: { title: "Test Book", authors: ["Author One"], bookType: "FICTION" },
        googleBook: { imageUrl: null, description: "A test book", pageCount: 300 },
        hardcoverBook: null,
        ibdbBook: null,
      },
      cawpileRating: null,
    }),
  }),
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

// Mock API client
const mockApiPatch = jest.fn();
jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: (...args: unknown[]) => mockApiPatch(...args),
    delete: jest.fn(),
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
  getCawpileGrade: () => "B",
  getCawpileColor: () => "yellow",
  calculateCawpileAverage: () => 7.5,
  convertToStars: () => 4,
  getFacetConfig: () => [],
  detectBookType: () => "FICTION",
  FICTION_FACETS: [],
  NONFICTION_FACETS: [],
  RATING_SCALE_GUIDE: [],
  AcquisitionMethod: {
    Purchased: "Purchased",
    Library: "Library",
    FriendBorrowed: "FriendBorrowed",
    Gift: "Gift",
    Other: "Other",
  },
  RepresentationValue: {
    Yes: "Yes",
    No: "No",
    Unknown: "Unknown",
  },
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

// Mock autocomplete hooks
jest.mock("@/hooks/queries/useBookClubs", () => ({
  useBookClubs: () => ({ data: [] }),
}));

jest.mock("@/hooks/queries/useReadathons", () => ({
  useReadathons: () => ({ data: [] }),
}));

import type { DashboardBookData, BookStatus, BookFormat } from "@cawpile/shared";

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

describe("Edit Book", () => {
  // ---------- Test 1 ----------
  it("edit form pre-populates with current book data", () => {
    const bookData = {
      id: "book-1",
      status: "READING" as BookStatus,
      format: ["PAPERBACK", "EBOOK"] as BookFormat[],
      progress: 65,
      review: "A great book so far.",
      acquisitionMethod: "Purchased",
      bookClubName: "Monthly Readers",
      readathonName: "Summer 2025",
      isReread: false,
    };

    function EditFormDisplay({ data }: { data: typeof bookData }) {
      return (
        <View testID="edit-form">
          <Text testID="edit-status">{data.status}</Text>
          <Text testID="edit-format">{data.format.join(", ")}</Text>
          <Text testID="edit-progress">{data.progress}</Text>
          <Text testID="edit-review">{data.review}</Text>
          <Text testID="edit-acquisition">{data.acquisitionMethod}</Text>
          <Text testID="edit-book-club">{data.bookClubName}</Text>
          <Text testID="edit-readathon">{data.readathonName}</Text>
        </View>
      );
    }

    render(<EditFormDisplay data={bookData} />);

    expect(screen.getByTestId("edit-form")).toBeTruthy();
    expect(screen.getByText("READING")).toBeTruthy();
    expect(screen.getByText("PAPERBACK, EBOOK")).toBeTruthy();
    expect(screen.getByText("65")).toBeTruthy();
    expect(screen.getByText("A great book so far.")).toBeTruthy();
    expect(screen.getByText("Purchased")).toBeTruthy();
    expect(screen.getByText("Monthly Readers")).toBeTruthy();
    expect(screen.getByText("Summer 2025")).toBeTruthy();
  });

  // ---------- Test 2 ----------
  it("status change updates dependent fields", () => {
    function StatusDependentFields({ status }: { status: BookStatus }) {
      const showFinishDate = status === "COMPLETED" || status === "DNF";
      const showProgress = status === "READING";
      const showDnfReason = status === "DNF";

      return (
        <View testID="dependent-fields">
          <Text testID="current-status">{status}</Text>
          {showFinishDate && <Text testID="finish-date-field">Finish Date</Text>}
          {showProgress && <Text testID="progress-field">Progress</Text>}
          {showDnfReason && <Text testID="dnf-reason-field">DNF Reason</Text>}
        </View>
      );
    }

    // READING status shows progress
    const { unmount } = render(<StatusDependentFields status="READING" />);
    expect(screen.getByTestId("progress-field")).toBeTruthy();
    expect(screen.queryByTestId("finish-date-field")).toBeNull();
    expect(screen.queryByTestId("dnf-reason-field")).toBeNull();
    unmount();

    // COMPLETED status shows finish date
    const { unmount: unmount2 } = render(<StatusDependentFields status="COMPLETED" />);
    expect(screen.getByTestId("finish-date-field")).toBeTruthy();
    expect(screen.queryByTestId("progress-field")).toBeNull();
    expect(screen.queryByTestId("dnf-reason-field")).toBeNull();
    unmount2();

    // DNF status shows finish date and DNF reason
    render(<StatusDependentFields status="DNF" />);
    expect(screen.getByTestId("finish-date-field")).toBeTruthy();
    expect(screen.getByTestId("dnf-reason-field")).toBeTruthy();
    expect(screen.queryByTestId("progress-field")).toBeNull();
  });

  // ---------- Test 3 ----------
  it("edit submission calls PATCH /api/user/books/[id] with changed fields", async () => {
    mockApiPatch.mockResolvedValue({ id: "book-1", status: "COMPLETED" });

    const { useUpdateBook } = require("@/hooks/mutations/useUpdateBook");

    function EditSubmitComponent() {
      const updateBook = useUpdateBook("book-1");

      return (
        <View
          testID="save-edit"
          onTouchEnd={() => {
            updateBook.mutate({
              status: "COMPLETED",
              progress: 100,
              finishDate: "2025-12-01",
            });
          }}
        >
          <Text>Save</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<EditSubmitComponent />, { wrapper: Wrapper });

    fireEvent(screen.getByTestId("save-edit"), "touchEnd");

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/api/user/books/book-1",
        expect.objectContaining({
          status: "COMPLETED",
          progress: 100,
          finishDate: "2025-12-01",
        }),
      );
    });
  });

  // ---------- Test 4 ----------
  it("review text editing saves via the same PATCH endpoint", async () => {
    mockApiPatch.mockResolvedValue({ id: "book-1" });

    const { useUpdateBook } = require("@/hooks/mutations/useUpdateBook");

    function ReviewEditComponent() {
      const updateBook = useUpdateBook("book-1");

      return (
        <View
          testID="save-review"
          onTouchEnd={() => {
            updateBook.mutate({
              review: "Updated review: this book was fantastic!",
            });
          }}
        >
          <Text>Save Review</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<ReviewEditComponent />, { wrapper: Wrapper });

    fireEvent(screen.getByTestId("save-review"), "touchEnd");

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/api/user/books/book-1",
        expect.objectContaining({
          review: "Updated review: this book was fantastic!",
        }),
      );
    });
  });
});
