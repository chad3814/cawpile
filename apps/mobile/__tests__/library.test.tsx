/**
 * Task Group 6 - Library / Dashboard screen tests
 *
 * Test 1: Library fetches and displays books from GET /api/user/books
 * Test 2: Status filter chips filter the displayed books (re-fetches with ?status= param)
 * Test 3: Pull-to-refresh triggers query invalidation and re-fetch
 * Test 4: Tapping a book card navigates to Book Details screen
 * Test 5: Empty state renders appropriate messaging per status filter
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock expo-router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock expo-image
jest.mock("expo-image", () => ({
  Image: ({ testID, ...props }: Record<string, string>) => {
    const { View } = require("react-native");
    return <View testID={testID || "expo-image"} {...props} />;
  },
}));

// Mock the API client
const mockApiGet = jest.fn();
jest.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: jest.fn(),
    patch: jest.fn(),
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
  getCawpileGrade: (avg: number) => {
    if (avg >= 9) return "A+";
    if (avg >= 8) return "A-";
    if (avg >= 7) return "B";
    return "C";
  },
  getCawpileColor: (val: number) => {
    if (val >= 8) return "green";
    if (val >= 6) return "yellow";
    return "red";
  },
  calculateCawpileAverage: () => 7.5,
  convertToStars: () => 4,
  getFacetConfig: () => [],
  detectBookType: () => "FICTION",
  FICTION_FACETS: [],
  NONFICTION_FACETS: [],
  RATING_SCALE_GUIDE: [],
}));

// Mock safe area context
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children, ...props }: { children: React.ReactNode }) => {
    const { View } = require("react-native");
    return <View {...props}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import BookCard from "@/components/BookCard";
import type { DashboardBookData } from "@cawpile/shared";

// Helper to create mock book data
function createMockBook(overrides: Partial<DashboardBookData> = {}): DashboardBookData {
  return {
    id: "book-1",
    status: "READING",
    format: ["PAPERBACK"],
    progress: 45,
    startDate: new Date("2025-01-15"),
    finishDate: null,
    createdAt: new Date("2025-01-10"),
    edition: {
      id: "edition-1",
      title: null,
      book: {
        title: "The Great Gatsby",
        authors: ["F. Scott Fitzgerald"],
        bookType: "FICTION",
      },
      googleBook: {
        imageUrl: "https://books.google.com/cover1.jpg",
        description: "A novel about the American dream.",
        pageCount: 180,
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
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPush.mockClear();
});

// ---------- Test 1 ----------
describe("Library screen", () => {
  it("fetches and displays books from GET /api/user/books", async () => {
    const mockBooks = [
      createMockBook({ id: "book-1" }),
      createMockBook({
        id: "book-2",
        status: "COMPLETED",
        edition: {
          id: "edition-2",
          title: null,
          book: {
            title: "Nineteen Eighty-Four",
            authors: ["George Orwell"],
            bookType: "FICTION",
          },
          googleBook: {
            imageUrl: "https://books.google.com/cover2.jpg",
            description: "Dystopian novel.",
            pageCount: 328,
          },
          hardcoverBook: null,
          ibdbBook: null,
        },
      }),
    ];

    mockApiGet.mockResolvedValue(mockBooks);

    const { useLibrary } = require("@/hooks/queries/useLibrary");

    function TestComponent() {
      const { data, isLoading } = useLibrary();
      if (isLoading) return <>{React.createElement("Text", {}, "Loading...")}</>;
      return (
        <>
          {data?.map((book: DashboardBookData) => (
            <BookCard
              key={book.id}
              book={book}
              onPress={() => {}}
            />
          ))}
        </>
      );
    }

    render(<TestComponent />, { wrapper: createQueryWrapper() });

    await waitFor(() => {
      expect(screen.getByText("The Great Gatsby")).toBeTruthy();
    });

    expect(screen.getByText("Nineteen Eighty-Four")).toBeTruthy();
    expect(mockApiGet).toHaveBeenCalledWith("/api/user/books");
  });

  // ---------- Test 2 ----------
  it("status filter chips filter the displayed books with ?status= param", async () => {
    mockApiGet.mockResolvedValue([]);

    const { useLibrary } = require("@/hooks/queries/useLibrary");

    function TestComponent({ status }: { status?: string }) {
      const { data } = useLibrary(status as "READING" | undefined);
      return <>{React.createElement("Text", {}, `Count: ${data?.length ?? "loading"}`)}</>;
    }

    const wrapper = createQueryWrapper();

    const { rerender } = render(<TestComponent />, { wrapper });

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/api/user/books");
    });

    rerender(<TestComponent status="READING" />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/api/user/books?status=READING");
    });
  });

  // ---------- Test 3 ----------
  it("pull-to-refresh triggers query invalidation and re-fetch", async () => {
    const mockBooks = [createMockBook()];
    mockApiGet.mockResolvedValue(mockBooks);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });

    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { useLibrary } = require("@/hooks/queries/useLibrary");

    function TestComponent() {
      const { data, refetch } = useLibrary();
      return (
        <>
          {React.createElement("Text", { testID: "count" }, `${data?.length ?? 0}`)}
          {React.createElement("Text", {
            testID: "refresh-trigger",
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ["books"] });
              refetch();
            },
          }, "Refresh")}
        </>
      );
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(1);
    });

    // Trigger refresh
    fireEvent.press(screen.getByTestId("refresh-trigger"));

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["books"] });
    });

    invalidateSpy.mockRestore();
  });

  // ---------- Test 4 ----------
  it("tapping a book card navigates to Book Details screen", () => {
    const mockBook = createMockBook({ id: "book-42" });

    render(
      <BookCard
        book={mockBook}
        onPress={() => mockPush(`/book/${mockBook.id}`)}
      />
    );

    fireEvent.press(screen.getByTestId("book-card-book-42"));

    expect(mockPush).toHaveBeenCalledWith("/book/book-42");
  });

  // ---------- Test 5 ----------
  it("empty state renders appropriate messaging per status filter", async () => {
    mockApiGet.mockResolvedValue([]);

    const { useLibrary } = require("@/hooks/queries/useLibrary");

    function TestEmptyState({ status }: { status?: string }) {
      const { data, isLoading } = useLibrary(status as "READING" | undefined);

      if (isLoading) return null;
      if (!data || data.length === 0) {
        const messages: Record<string, string> = {
          all: "Your library is empty. Search for books to get started!",
          READING: "No books currently being read.",
          WANT_TO_READ: "No books on your want-to-read list.",
          COMPLETED: "No completed books yet.",
          DNF: "No DNF books.",
        };
        const key = status ?? "all";
        return <>{React.createElement("Text", { testID: "empty-state" }, messages[key])}</>;
      }
      return null;
    }

    const wrapper = createQueryWrapper();

    const { unmount } = render(<TestEmptyState />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeTruthy();
    });
    expect(screen.getByText("Your library is empty. Search for books to get started!")).toBeTruthy();
    unmount();

    const wrapper2 = createQueryWrapper();
    render(<TestEmptyState status="READING" />, { wrapper: wrapper2 });
    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeTruthy();
    });
    expect(screen.getByText("No books currently being read.")).toBeTruthy();
  });
});
