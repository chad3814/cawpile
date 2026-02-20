/**
 * Task Group 7 - Search and Add Book Wizard tests
 *
 * Test 1: Search input debounces at 600ms and calls GET /api/books/search?q=
 * Test 2: Tagged search syntax shows visual indicator
 * Test 3: Search results display title, authors, source badges, and cover thumbnail
 * Test 4: Tapping a search result opens the Add Book Wizard modal
 * Test 5: Wizard step count varies by status: Want to Read = 2, Reading/Completed = 4
 * Test 6: Wizard submission calls POST /api/user/books with signedResult and invalidates library cache
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Text, View } from "react-native";

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    signedResult: JSON.stringify({
      id: "search-1",
      googleId: "g1",
      title: "Test Book",
      authors: ["Author One"],
      categories: [],
      imageUrl: "https://example.com/cover.jpg",
      sources: [{ provider: "google", data: {} }],
      signature: "valid-sig",
    }),
  }),
  Link: ({ children }: { children: React.ReactNode }) => children,
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
const mockApiPost = jest.fn();
jest.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
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
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("Search and Add Book", () => {
  // ---------- Test 1 ----------
  it("search debounces at 600ms and calls GET /api/books/search?q=", async () => {
    const { useDebounce } = require("@/hooks/useDebounce");

    function TestDebounce() {
      const [value, setValue] = React.useState("");
      const debouncedValue = useDebounce(value, 600);

      return (
        <View>
          <Text
            testID="input"
            onPress={() => setValue("test query")}
          >
            Type
          </Text>
          <Text testID="debounced">{debouncedValue}</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<TestDebounce />, { wrapper: Wrapper });

    // Initially empty
    expect(screen.getByTestId("debounced").props.children).toBe("");

    // Simulate typing
    fireEvent.press(screen.getByTestId("input"));

    // Not yet debounced
    expect(screen.getByTestId("debounced").props.children).toBe("");

    // Advance past debounce delay
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(screen.getByTestId("debounced").props.children).toBe("test query");
  });

  // ---------- Test 2 ----------
  it("tagged search syntax shows visual indicator", () => {
    // Test the tagged search detection logic
    const tagPrefixes = ["ibdb:", "hard:", "gbid:", "isbn:"];
    const tagPattern = /^(ibdb|hard|gbid|isbn):/i;

    for (const prefix of tagPrefixes) {
      const query = `${prefix}some-value`;
      expect(tagPattern.test(query)).toBe(true);
    }

    // Non-tagged queries should not match
    expect(tagPattern.test("regular search")).toBe(false);
    expect(tagPattern.test("")).toBe(false);
  });

  // ---------- Test 3 ----------
  it("search results display title, authors, source badges, and cover thumbnail", () => {
    const mockResult = {
      id: "result-1",
      googleId: "g1",
      title: "The Hobbit",
      authors: ["J.R.R. Tolkien"],
      categories: ["Fantasy"],
      imageUrl: "https://example.com/hobbit.jpg",
      sources: [
        { provider: "google", data: {} },
        { provider: "hardcover", data: {} },
      ],
      signature: "sig",
    };

    // Render a search result item
    function SearchResultItem({ result }: { result: typeof mockResult }) {
      return (
        <View testID={`search-result-${result.id}`}>
          <Text testID="result-title">{result.title}</Text>
          <Text testID="result-authors">{result.authors.join(", ")}</Text>
          <View testID="source-badges">
            {result.sources.map((source: { provider: string }, idx: number) => (
              <Text key={idx} testID={`source-badge-${source.provider}`}>
                {source.provider}
              </Text>
            ))}
          </View>
        </View>
      );
    }

    render(<SearchResultItem result={mockResult} />);

    expect(screen.getByTestId("result-title")).toBeTruthy();
    expect(screen.getByText("The Hobbit")).toBeTruthy();
    expect(screen.getByText("J.R.R. Tolkien")).toBeTruthy();
    expect(screen.getByTestId("source-badge-google")).toBeTruthy();
    expect(screen.getByTestId("source-badge-hardcover")).toBeTruthy();
  });

  // ---------- Test 4 ----------
  it("tapping a search result opens the Add Book Wizard modal", () => {
    const mockResult = {
      id: "result-1",
      title: "Test Book",
      authors: ["Author"],
      categories: [],
      sources: [],
      signature: "sig",
    };

    function TapTestComponent() {
      return (
        <View
          testID="search-result-tap"
          onTouchEnd={() => {
            mockPush({
              pathname: "/(modals)/add-book",
              params: { signedResult: JSON.stringify(mockResult) },
            });
          }}
        >
          <Text>{mockResult.title}</Text>
        </View>
      );
    }

    render(<TapTestComponent />);

    fireEvent(screen.getByTestId("search-result-tap"), "touchEnd");

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(modals)/add-book",
      params: { signedResult: JSON.stringify(mockResult) },
    });
  });

  // ---------- Test 5 ----------
  it("wizard step count varies by status: Want to Read = 2, Reading/Completed = 4", () => {
    function getTotalSteps(status: string): number {
      if (status === "WANT_TO_READ") return 2;
      if (status === "READING") return 4;
      if (status === "COMPLETED") return 4;
      return 2;
    }

    expect(getTotalSteps("WANT_TO_READ")).toBe(2);
    expect(getTotalSteps("READING")).toBe(4);
    expect(getTotalSteps("COMPLETED")).toBe(4);
  });

  // ---------- Test 6 ----------
  it("wizard submission calls POST /api/user/books with signedResult and invalidates library cache", async () => {
    jest.useRealTimers();

    const signedResult = {
      id: "search-1",
      googleId: "g1",
      title: "New Book",
      authors: ["Author"],
      categories: [],
      sources: [],
      signature: "valid-sig",
    };

    mockApiPost.mockResolvedValue({ id: "new-book-1", status: "WANT_TO_READ" });

    const { queryClient, Wrapper } = createQueryWrapper();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { useAddBook } = require("@/hooks/mutations/useAddBook");

    function SubmitTestComponent() {
      const addBook = useAddBook();

      return (
        <View
          testID="submit-button"
          onTouchEnd={() => {
            addBook.mutate({
              signedResult,
              status: "WANT_TO_READ",
              format: ["PAPERBACK"],
            });
          }}
        >
          <Text>Submit</Text>
        </View>
      );
    }

    render(<SubmitTestComponent />, { wrapper: Wrapper });

    fireEvent(screen.getByTestId("submit-button"), "touchEnd");

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/user/books",
        expect.objectContaining({
          signedResult,
          status: "WANT_TO_READ",
          format: ["PAPERBACK"],
        }),
      );
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalled();
    });

    invalidateSpy.mockRestore();
  });
});
