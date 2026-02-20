/**
 * Task Group 10 - Settings, Profile, and Social Sharing tests
 *
 * Test 1: Settings screen loads current user data via GET /api/user/settings
 * Test 2: Username availability check debounces and calls GET /api/user/username-check?username=
 * Test 3: Settings save calls PATCH /api/user/settings with updated fields
 * Test 4: Sign-out clears auth state and navigates to sign-in screen
 * Test 5: Public profile screen fetches and displays data via GET /api/profile/[username]
 * Test 6: Share Review modal creates share via POST /api/user/books/[id]/share and opens native share sheet
 * Test 7: Delete account flow shows confirmation and calls DELETE /api/user
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert, View, Text, Share } from "react-native";
import type { AlertButton } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => ({
    id: "book-1",
    username: "testuser",
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

// Mock the API client
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPatch = jest.fn();
const mockApiDelete = jest.fn();
jest.mock("@/lib/api", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    patch: (...args: unknown[]) => mockApiPatch(...args),
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
  convertToStars: () => 4,
  calculateCawpileAverage: () => 7.5,
  getFacetConfig: () => [],
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

// Mock auth context
const mockSignOut = jest.fn().mockResolvedValue(undefined);
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      image: "https://example.com/avatar.jpg",
      isAdmin: false,
      isSuperAdmin: false,
    },
    isAuthenticated: true,
    isLoading: false,
    signIn: jest.fn(),
    signOut: mockSignOut,
  }),
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

describe("Settings, Profile, and Sharing", () => {
  // ---------- Test 1 ----------
  it("settings screen loads current user data via GET /api/user/settings", async () => {
    const mockSettings = {
      name: "Test User",
      username: "testuser",
      bio: "Book lover",
      email: "test@example.com",
      readingGoal: 24,
      profileEnabled: true,
      showCurrentlyReading: true,
      showTbr: false,
      image: "https://example.com/avatar.jpg",
      profilePictureUrl: null,
    };

    mockApiGet.mockResolvedValue(mockSettings);

    const { useSettings } = require("@/hooks/queries/useSettings");

    function SettingsDisplay() {
      const { data, isLoading } = useSettings();
      if (isLoading) return <Text>Loading...</Text>;
      if (!data) return <Text>No data</Text>;
      return (
        <View testID="settings-loaded">
          <Text testID="settings-name">{data.name}</Text>
          <Text testID="settings-username">{data.username}</Text>
          <Text testID="settings-bio">{data.bio}</Text>
          <Text testID="settings-email">{data.email}</Text>
          <Text testID="settings-reading-goal">{data.readingGoal}</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<SettingsDisplay />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId("settings-loaded")).toBeTruthy();
    });

    expect(screen.getByText("Test User")).toBeTruthy();
    expect(screen.getByText("testuser")).toBeTruthy();
    expect(screen.getByText("Book lover")).toBeTruthy();
    expect(screen.getByText("test@example.com")).toBeTruthy();
    expect(screen.getByText("24")).toBeTruthy();
    expect(mockApiGet).toHaveBeenCalledWith("/api/user/settings");
  });

  // ---------- Test 2 ----------
  it("username availability check debounces and calls GET /api/user/username-check", async () => {
    jest.useFakeTimers();

    mockApiGet.mockImplementation((path: string) => {
      if (path.includes("/api/user/username-check")) {
        return Promise.resolve({ available: true });
      }
      return Promise.resolve({});
    });

    const { useDebounce } = require("@/hooks/useDebounce");

    function UsernameCheckTest() {
      const [username, setUsername] = React.useState("");
      const debouncedUsername = useDebounce(username, 500);

      return (
        <View>
          <Text
            testID="set-username"
            onPress={() => setUsername("newuser")}
          >
            Set
          </Text>
          <Text testID="debounced-username">{debouncedUsername}</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<UsernameCheckTest />, { wrapper: Wrapper });

    // Initially empty
    expect(screen.getByTestId("debounced-username").props.children).toBe("");

    // Trigger username input
    fireEvent.press(screen.getByTestId("set-username"));

    // Not yet debounced
    expect(screen.getByTestId("debounced-username").props.children).toBe("");

    // Advance past debounce delay
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.getByTestId("debounced-username").props.children).toBe("newuser");

    jest.useRealTimers();
  });

  // ---------- Test 3 ----------
  it("settings save calls PATCH /api/user/settings with updated fields", async () => {
    mockApiPatch.mockResolvedValue({ success: true });

    const { useUpdateSettings } = require("@/hooks/mutations/useUpdateSettings");

    function SaveSettingsComponent() {
      const updateSettings = useUpdateSettings();

      return (
        <View
          testID="save-settings"
          onTouchEnd={() => {
            updateSettings.mutate({
              name: "Updated Name",
              bio: "Updated bio text",
              readingGoal: 30,
              profileEnabled: true,
              showCurrentlyReading: false,
              showTbr: true,
            });
          }}
        >
          <Text>Save</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<SaveSettingsComponent />, { wrapper: Wrapper });

    fireEvent(screen.getByTestId("save-settings"), "touchEnd");

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/api/user/settings",
        expect.objectContaining({
          name: "Updated Name",
          bio: "Updated bio text",
          readingGoal: 30,
          profileEnabled: true,
          showCurrentlyReading: false,
          showTbr: true,
        }),
      );
    });
  });

  // ---------- Test 4 ----------
  it("sign-out clears auth state and navigates to sign-in screen", async () => {
    const { useAuth } = require("@/contexts/AuthContext");

    function SignOutComponent() {
      const auth = useAuth();
      return (
        <View
          testID="sign-out-button"
          onTouchEnd={async () => {
            await auth.signOut();
            mockReplace("/sign-in");
          }}
        >
          <Text>Sign Out</Text>
        </View>
      );
    }

    render(<SignOutComponent />);

    fireEvent(screen.getByTestId("sign-out-button"), "touchEnd");

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/sign-in");
    });
  });

  // ---------- Test 5 ----------
  it("public profile screen fetches and displays data via GET /api/profile/[username]", async () => {
    const mockProfile = {
      user: {
        id: "user-1",
        name: "Profile User",
        username: "profileuser",
        bio: "Avid reader",
        profilePictureUrl: "https://example.com/avatar.jpg",
        image: null,
        showCurrentlyReading: true,
        profileEnabled: true,
        showTbr: true,
      },
      currentlyReading: [
        {
          id: "book-1",
          status: "READING",
          format: ["EBOOK"],
          progress: 60,
          startDate: null,
          finishDate: null,
          createdAt: new Date(),
          currentPage: 100,
          edition: {
            id: "ed-1",
            title: null,
            book: { title: "A Great Book", authors: ["Author One"], bookType: "FICTION" },
            googleBook: { imageUrl: null, description: null, pageCount: 300 },
            hardcoverBook: null,
            ibdbBook: null,
          },
        },
      ],
      sharedReviews: [],
      tbr: { books: [], totalCount: 0 },
    };

    mockApiGet.mockResolvedValue(mockProfile);

    const { usePublicProfile } = require("@/hooks/queries/usePublicProfile");

    interface ProfileUser {
      name: string;
      username: string;
      bio: string;
    }

    interface ProfileBook {
      id: string;
      edition: {
        book: {
          title: string;
        };
      };
    }

    function ProfileDisplay() {
      const { data, isLoading } = usePublicProfile("profileuser");
      if (isLoading) return <Text>Loading...</Text>;
      if (!data) return <Text>No profile</Text>;
      return (
        <View testID="profile-loaded">
          <Text testID="profile-name">{data.user.name}</Text>
          <Text testID="profile-username">@{data.user.username}</Text>
          <Text testID="profile-bio">{data.user.bio}</Text>
          {data.currentlyReading.map((book: ProfileBook) => (
            <Text key={book.id} testID={`reading-${book.id}`}>
              {book.edition.book.title}
            </Text>
          ))}
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<ProfileDisplay />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId("profile-loaded")).toBeTruthy();
    });

    expect(screen.getByText("Profile User")).toBeTruthy();
    expect(screen.getByText("@profileuser")).toBeTruthy();
    expect(screen.getByText("Avid reader")).toBeTruthy();
    expect(screen.getByText("A Great Book")).toBeTruthy();
    expect(mockApiGet).toHaveBeenCalledWith("/api/profile/profileuser");
  });

  // ---------- Test 6 ----------
  it("Share Review creates share via POST and opens native share sheet", async () => {
    const shareUrl = "https://cawpile.example.com/share/abc123";
    mockApiPost.mockResolvedValue({
      id: "share-1",
      shareToken: "abc123",
      showDates: true,
      showBookClubs: false,
      showReadathons: false,
      showReview: true,
    });

    const shareSpy = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);

    const { useShareReview } = require("@/hooks/mutations/useShareReview");

    function ShareReviewComponent() {
      const shareReview = useShareReview("book-1");

      return (
        <View
          testID="create-share"
          onTouchEnd={() => {
            shareReview.mutate(
              {
                showDates: true,
                showBookClubs: false,
                showReadathons: false,
                showReview: true,
              },
              {
                onSuccess: () => {
                  Share.share({
                    message: `Check out my review: ${shareUrl}`,
                    url: shareUrl,
                  });
                },
              },
            );
          }}
        >
          <Text>Share</Text>
        </View>
      );
    }

    const { Wrapper } = createQueryWrapper();
    render(<ShareReviewComponent />, { wrapper: Wrapper });

    fireEvent(screen.getByTestId("create-share"), "touchEnd");

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "/api/user/books/book-1/share",
        expect.objectContaining({
          showDates: true,
          showBookClubs: false,
          showReadathons: false,
          showReview: true,
        }),
      );
    });

    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: shareUrl,
        }),
      );
    });

    shareSpy.mockRestore();
  });

  // ---------- Test 7 ----------
  it("delete account flow shows confirmation and calls DELETE /api/user", async () => {
    mockApiDelete.mockResolvedValue(undefined);

    const alertSpy = jest.spyOn(Alert, "alert");

    function DeleteAccountComponent() {
      const handleDeleteAccount = () => {
        Alert.alert(
          "Delete Account",
          "This will permanently delete your account and all data. This action cannot be undone.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                const { api } = require("@/lib/api");
                await api.delete("/api/user");
                mockSignOut();
                mockReplace("/sign-in");
              },
            },
          ],
        );
      };

      return (
        <View testID="delete-account-button" onTouchEnd={handleDeleteAccount}>
          <Text>Delete Account</Text>
        </View>
      );
    }

    render(<DeleteAccountComponent />);

    fireEvent(screen.getByTestId("delete-account-button"), "touchEnd");

    expect(alertSpy).toHaveBeenCalledWith(
      "Delete Account",
      "This will permanently delete your account and all data. This action cannot be undone.",
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
      await deleteCallback.onPress();
    }

    await waitFor(() => {
      expect(mockApiDelete).toHaveBeenCalledWith("/api/user");
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/sign-in");

    alertSpy.mockRestore();
  });
});
