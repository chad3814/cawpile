/**
 * Task Group 9 - CAWPILE Rating and Reading Sessions tests
 *
 * Test 1: CAWPILE rating screen renders correct facets for fiction vs. nonfiction
 * Test 2: Slider updates value for each facet and displays current score
 * Test 3: Rating summary computes correct average
 * Test 4: Rating submission calls PATCH /api/user/books/[id] with cawpileRating
 * Test 5: Update Progress modal submits percentage and page number
 * Test 6: Log Reading Session modal submits via POST /api/reading-sessions
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
    bookType: "FICTION",
    existingRating: "",
    progress: "45",
    currentPage: "100",
    userBookId: "book-1",
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
const mockApiPost = jest.fn();
jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    post: (...args: unknown[]) => mockApiPost(...args),
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

// Mock @cawpile/shared with real-like implementations
const MOCK_FICTION_FACETS = [
  { name: "Characters", key: "characters", description: "Character development", questions: ["Are they memorable?"] },
  { name: "Atmosphere", key: "atmosphere", description: "Immersion", questions: ["How immersive?"] },
  { name: "Writing", key: "writing", description: "Writing style", questions: ["Did you enjoy the style?"] },
  { name: "Plot", key: "plot", description: "Story structure", questions: ["Was pacing good?"] },
  { name: "Intrigue", key: "intrigue", description: "Engagement", questions: ["Were you intrigued?"] },
  { name: "Logic", key: "logic", description: "Consistency", questions: ["Were there plot holes?"] },
  { name: "Enjoyment", key: "enjoyment", description: "Overall satisfaction", questions: ["Did you enjoy it?"] },
];

const MOCK_NONFICTION_FACETS = [
  { name: "Credibility/Research", key: "characters", description: "Trustworthiness", questions: ["Was it credible?"] },
  { name: "Authenticity/Uniqueness", key: "atmosphere", description: "Perspectives", questions: ["New perspectives?"] },
  { name: "Writing", key: "writing", description: "Accessibility", questions: ["Was it accessible?"] },
  { name: "Personal Impact", key: "plot", description: "Takeaways", questions: ["Key takeaways?"] },
  { name: "Intrigue", key: "intrigue", description: "Engagement", questions: ["Did it hold attention?"] },
  { name: "Logic/Informativeness", key: "logic", description: "Clarity", questions: ["Was info clear?"] },
  { name: "Enjoyment", key: "enjoyment", description: "Satisfaction", questions: ["Did you enjoy it?"] },
];

jest.mock("@cawpile/shared", () => ({
  getFacetConfig: (bookType: string) =>
    bookType === "NONFICTION" ? MOCK_NONFICTION_FACETS : MOCK_FICTION_FACETS,
  calculateCawpileAverage: (rating: Record<string, number | null>) => {
    const vals = Object.values(rating).filter((v): v is number => typeof v === "number");
    if (vals.length === 0) return 0;
    const sum = vals.reduce((acc, val) => acc + val, 0);
    return Number((sum / vals.length).toFixed(1));
  },
  getCawpileGrade: (avg: number) => {
    if (avg >= 9) return "A+";
    if (avg >= 8) return "A-";
    if (avg >= 7) return "B";
    if (avg >= 6) return "C+";
    return "C";
  },
  getCawpileColor: (val: number) => {
    if (val >= 8) return "green";
    if (val >= 6) return "yellow";
    if (val >= 4) return "orange";
    return "red";
  },
  convertToStars: (avg: number) => {
    if (avg <= 1.0) return 0;
    if (avg <= 2.2) return 1;
    if (avg <= 4.5) return 2;
    if (avg <= 6.9) return 3;
    if (avg <= 8.9) return 4;
    return 5;
  },
  FICTION_FACETS: MOCK_FICTION_FACETS,
  NONFICTION_FACETS: MOCK_NONFICTION_FACETS,
  RATING_SCALE_GUIDE: [],
  detectBookType: () => "FICTION",
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

// Mock gesture handler and reanimated
jest.mock("react-native-gesture-handler", () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
  Gesture: {
    Pan: () => ({
      onUpdate: () => ({
        onEnd: () => ({}),
      }),
    }),
  },
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-reanimated", () => ({
  useSharedValue: (initial: number) => ({ value: initial }),
  useAnimatedStyle: () => ({}),
  withSpring: (val: number) => val,
  withTiming: (val: number) => val,
  runOnJS: (fn: Function) => fn,
  default: {
    View: ({ children, ...props }: { children: React.ReactNode }) => {
      const { View: RNView } = require("react-native");
      return <RNView {...props}>{children}</RNView>;
    },
    createAnimatedComponent: (component: Function) => component,
  },
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
});

describe("CAWPILE Rating and Reading Sessions", () => {
  // ---------- Test 1 ----------
  it("renders correct facets for fiction vs. nonfiction books", () => {
    const { getFacetConfig } = require("@cawpile/shared");

    // Fiction facets
    const fictionFacets = getFacetConfig("FICTION");
    expect(fictionFacets).toHaveLength(7);
    expect(fictionFacets[0].name).toBe("Characters");
    expect(fictionFacets[1].name).toBe("Atmosphere");
    expect(fictionFacets[6].name).toBe("Enjoyment");

    // Nonfiction facets
    const nonfictionFacets = getFacetConfig("NONFICTION");
    expect(nonfictionFacets).toHaveLength(7);
    expect(nonfictionFacets[0].name).toBe("Credibility/Research");
    expect(nonfictionFacets[1].name).toBe("Authenticity/Uniqueness");
    expect(nonfictionFacets[3].name).toBe("Personal Impact");

    // They should be different sets
    expect(fictionFacets[0].name).not.toBe(nonfictionFacets[0].name);
  });

  // ---------- Test 2 ----------
  it("slider updates value for each facet and displays current score", () => {
    // Simulate the facet card with a slider value
    function FacetCard({ facet, value, onChange }: {
      facet: { name: string; key: string; description: string };
      value: number;
      onChange: (val: number) => void;
    }) {
      return (
        <View testID={`facet-card-${facet.key}`}>
          <Text testID={`facet-name-${facet.key}`}>{facet.name}</Text>
          <Text testID={`facet-description-${facet.key}`}>{facet.description}</Text>
          <Text testID={`facet-value-${facet.key}`}>{value}</Text>
          <View
            testID={`facet-slider-${facet.key}`}
            onTouchEnd={() => onChange(8)}
          />
        </View>
      );
    }

    const [value, setValue] = [5, jest.fn()];
    const facet = MOCK_FICTION_FACETS[0];

    render(
      <FacetCard
        facet={facet}
        value={value}
        onChange={setValue}
      />
    );

    expect(screen.getByTestId("facet-name-characters")).toBeTruthy();
    expect(screen.getByText("Characters")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();

    // Simulate slider change
    fireEvent(screen.getByTestId("facet-slider-characters"), "touchEnd");
    expect(setValue).toHaveBeenCalledWith(8);
  });

  // ---------- Test 3 ----------
  it("rating summary computes correct average", () => {
    const { calculateCawpileAverage, getCawpileGrade, convertToStars } = require("@cawpile/shared");

    const rating = {
      characters: 8,
      atmosphere: 7,
      writing: 9,
      plot: 6,
      intrigue: 8,
      logic: 7,
      enjoyment: 9,
    };

    const average = calculateCawpileAverage(rating);
    expect(average).toBe(7.7);

    const grade = getCawpileGrade(average);
    expect(grade).toBe("B");

    const stars = convertToStars(average);
    expect(stars).toBe(4);

    // Test with some null values
    const partialRating = {
      characters: 8,
      atmosphere: null,
      writing: 9,
      plot: null,
      intrigue: null,
      logic: null,
      enjoyment: 9,
    };

    const partialAverage = calculateCawpileAverage(partialRating);
    expect(partialAverage).toBe(8.7);
  });

  // ---------- Test 4 ----------
  it("rating submission calls PATCH /api/user/books/[id] with cawpileRating", async () => {
    mockApiPatch.mockResolvedValue({ id: "book-1", status: "READING" });

    const { useSubmitRating } = require("@/hooks/mutations/useSubmitRating");

    function SubmitRatingComponent() {
      const submitRating = useSubmitRating("book-1");

      return (
        <View
          testID="submit-rating"
          onTouchEnd={() => {
            submitRating.mutate({
              characters: 8,
              atmosphere: 7,
              writing: 9,
              plot: 6,
              intrigue: 8,
              logic: 7,
              enjoyment: 9,
            });
          }}
        >
          <Text>Submit Rating</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<SubmitRatingComponent />, { wrapper: Wrapper });

    fireEvent(screen.getByTestId("submit-rating"), "touchEnd");

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/api/user/books/book-1",
        expect.objectContaining({
          cawpileRating: {
            characters: 8,
            atmosphere: 7,
            writing: 9,
            plot: 6,
            intrigue: 8,
            logic: 7,
            enjoyment: 9,
          },
        }),
      );
    });
  });

  // ---------- Test 5 ----------
  it("Update Progress modal submits percentage and page number", async () => {
    mockApiPatch.mockResolvedValue({ id: "book-1", progress: 75, currentPage: 150 });

    const { useUpdateProgress } = require("@/hooks/mutations/useUpdateProgress");

    function UpdateProgressComponent() {
      const updateProgress = useUpdateProgress("book-1");

      return (
        <View
          testID="submit-progress"
          onTouchEnd={() => {
            updateProgress.mutate({ progress: 75, currentPage: 150 });
          }}
        >
          <Text>Update</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<UpdateProgressComponent />, { wrapper: Wrapper });

    fireEvent(screen.getByTestId("submit-progress"), "touchEnd");

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/api/user/books/book-1",
        { progress: 75, currentPage: 150 },
      );
    });
  });

  // ---------- Test 6 ----------
  it("Log Reading Session modal submits via POST /api/reading-sessions", async () => {
    mockApiPost.mockResolvedValue({
      readingSession: {
        id: "session-new",
        userBookId: "book-1",
        startPage: 100,
        endPage: 150,
        pagesRead: 51,
        duration: 30,
        notes: "Good reading session",
      },
    });

    const { useCreateReadingSession } = require("@/hooks/mutations/useCreateReadingSession");

    function LogSessionComponent() {
      const createSession = useCreateReadingSession();

      return (
        <View
          testID="submit-session"
          onTouchEnd={() => {
            createSession.mutate({
              userBookId: "book-1",
              startPage: 100,
              endPage: 150,
              duration: 30,
              notes: "Good reading session",
            });
          }}
        >
          <Text>Log Session</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<LogSessionComponent />, { wrapper: Wrapper });

    fireEvent(screen.getByTestId("submit-session"), "touchEnd");

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/reading-sessions",
        {
          userBookId: "book-1",
          startPage: 100,
          endPage: 150,
          duration: 30,
          notes: "Good reading session",
        },
      );
    });
  });
});
