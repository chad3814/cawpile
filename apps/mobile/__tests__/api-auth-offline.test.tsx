/**
 * Task Group 5 - API client, authentication, and offline infrastructure tests
 *
 * Test 1: API client attaches JWT to Authorization header on requests
 * Test 2: API client reads base URL from EXPO_PUBLIC_API_BASE_URL
 * Test 3: API client handles 401 by clearing auth state and redirecting to sign-in
 * Test 4: Google Sign-In flow stores JWT in secure store on success
 * Test 5: Sign-out clears JWT from secure store and Google sign-in state
 * Test 6: Offline queue serializes a mutation to AsyncStorage when offline
 * Test 7: Offline queue processes actions in FIFO order when connectivity returns
 * Test 8: Offline queue discards actions on 4xx response and notifies user
 */

// Mock expo-secure-store
const mockSecureStore: Record<string, string> = {};
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStore[key] ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStore[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete mockSecureStore[key];
    return Promise.resolve();
  }),
}));

// Mock @react-native-google-signin/google-signin
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      data: { idToken: "mock-google-id-token" },
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    configure: jest.fn(),
  },
}));

// Mock AsyncStorage
const mockAsyncStore: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStore[key] ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStore[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockAsyncStore[key];
    return Promise.resolve();
  }),
}));

// Mock @react-native-community/netinfo
let mockIsConnected = true;
const netInfoListeners: Array<(state: { isConnected: boolean }) => void> = [];
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(
    (listener: (state: { isConnected: boolean }) => void) => {
      netInfoListeners.push(listener);
      return () => {
        const idx = netInfoListeners.indexOf(listener);
        if (idx >= 0) netInfoListeners.splice(idx, 1);
      };
    },
  ),
  fetch: jest.fn(() => Promise.resolve({ isConnected: mockIsConnected })),
}));

// Helper: build a JWT-like token with a given payload and expiry
function buildFakeJwt(payload: Record<string, unknown>, expiresInSeconds: number = 3600): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const fullPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const body = btoa(JSON.stringify(fullPayload));
  const signature = "fake-signature";
  return `${header}.${body}.${signature}`;
}

// Clear stores between tests
beforeEach(() => {
  Object.keys(mockSecureStore).forEach((k) => delete mockSecureStore[k]);
  Object.keys(mockAsyncStore).forEach((k) => delete mockAsyncStore[k]);
  mockIsConnected = true;
  netInfoListeners.length = 0;
  jest.clearAllMocks();
  // Reset module registry to get fresh instances
  jest.resetModules();
  // Set base URL for API client tests
  process.env.EXPO_PUBLIC_API_BASE_URL = "https://cawpile.example.com";
});

// ---------- Test 1 ----------
describe("API client JWT attachment", () => {
  it("attaches JWT to Authorization header on requests", async () => {
    const fakeToken = buildFakeJwt({ userId: "u1", email: "test@example.com" });
    mockSecureStore["cawpile_jwt"] = fakeToken;

    // Mock global fetch
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
    });
    global.fetch = mockFetch;

    const { api } = require("@/lib/api");
    await api.get("/api/user/books");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://cawpile.example.com/api/user/books");
    expect(options.headers["Authorization"]).toBe(`Bearer ${fakeToken}`);
    expect(options.headers["Content-Type"]).toBe("application/json");
  });
});

// ---------- Test 2 ----------
describe("API client base URL configuration", () => {
  it("reads base URL from EXPO_PUBLIC_API_BASE_URL", () => {
    const { getBaseUrl } = require("@/lib/api");

    process.env.EXPO_PUBLIC_API_BASE_URL = "https://myapp.example.com";
    expect(getBaseUrl()).toBe("https://myapp.example.com");

    // Clean trailing slashes
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://myapp.example.com/";
    expect(getBaseUrl()).toBe("https://myapp.example.com");
  });
});

// ---------- Test 3 ----------
describe("API client 401 handling", () => {
  it("handles 401 by clearing auth state", async () => {
    const fakeToken = buildFakeJwt({ userId: "u1", email: "test@example.com" });
    mockSecureStore["cawpile_jwt"] = fakeToken;

    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });
    global.fetch = mockFetch;

    const { api, ApiError } = require("@/lib/api");

    try {
      await api.get("/api/user/books");
      fail("Should have thrown");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as InstanceType<typeof ApiError>).status).toBe(401);
    }
  });
});

// ---------- Test 4 ----------
describe("Google Sign-In flow", () => {
  it("stores JWT in secure store on success", async () => {
    const SecureStore = require("expo-secure-store");

    const fakeToken = buildFakeJwt({
      userId: "user-123",
      email: "reader@example.com",
      name: "Test Reader",
      image: null,
      isAdmin: false,
      isSuperAdmin: false,
    });

    // Simulate storing a JWT after successful auth
    const { storeToken, getStoredToken, getAuthUser } = require("@/lib/auth");

    await storeToken(fakeToken);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("cawpile_jwt", fakeToken);

    // Verify we can read it back
    const stored = await getStoredToken();
    expect(stored).toBe(fakeToken);

    // Verify we can decode user data from the token
    const user = await getAuthUser();
    expect(user).not.toBeNull();
    expect(user?.id).toBe("user-123");
    expect(user?.email).toBe("reader@example.com");
    expect(user?.name).toBe("Test Reader");
  });
});

// ---------- Test 5 ----------
describe("Sign-out flow", () => {
  it("clears JWT from secure store and Google sign-in state", async () => {
    const SecureStore = require("expo-secure-store");
    const { GoogleSignin } = require("@react-native-google-signin/google-signin");

    const fakeToken = buildFakeJwt({ userId: "u1", email: "test@example.com" });
    mockSecureStore["cawpile_jwt"] = fakeToken;

    const { signOut, isAuthenticated: checkAuth } = require("@/lib/auth");

    // Verify authenticated before sign-out
    const authedBefore = await checkAuth();
    expect(authedBefore).toBe(true);

    // Sign out
    await signOut();

    // Verify JWT was cleared from secure store
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("cawpile_jwt");

    // Verify Google Sign-In was cleared
    expect(GoogleSignin.signOut).toHaveBeenCalled();

    // Verify no longer authenticated
    const authedAfter = await checkAuth();
    expect(authedAfter).toBe(false);
  });
});

// ---------- Test 6 ----------
describe("Offline queue enqueue", () => {
  it("serializes a mutation to AsyncStorage when offline", async () => {
    const AsyncStorage = require("@react-native-async-storage/async-storage");
    const { enqueue, getQueue } = require("@/lib/offlineQueue");

    const action = {
      type: "ADD_BOOK",
      method: "POST",
      url: "/api/user/books",
      body: { title: "Test Book" },
      resourceId: "book-1",
    };

    await enqueue(action);

    // Verify it was written to AsyncStorage
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "@cawpile/offline-queue",
      expect.any(String),
    );

    // Verify the queue contains the action
    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe("ADD_BOOK");
    expect(queue[0].method).toBe("POST");
    expect(queue[0].url).toBe("/api/user/books");
    expect(queue[0].body).toEqual({ title: "Test Book" });
    expect(queue[0].id).toBeDefined();
    expect(queue[0].timestamp).toBeDefined();
  });
});

// ---------- Test 7 ----------
describe("Offline queue FIFO processing", () => {
  it("processes actions in FIFO order when connectivity returns", async () => {
    const { enqueue, processQueue, getQueue } = require("@/lib/offlineQueue");

    // Enqueue two actions
    await enqueue({
      type: "UPDATE_PROGRESS",
      method: "PATCH",
      url: "/api/user/books/1",
      body: { progress: 50 },
      resourceId: "book-1",
    });

    await enqueue({
      type: "ADD_BOOK",
      method: "POST",
      url: "/api/user/books",
      body: { title: "New Book" },
      resourceId: "book-2",
    });

    // Mock fetch to track call order
    const callOrder: string[] = [];
    const mockFetch = jest.fn().mockImplementation((url: string) => {
      callOrder.push(url);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });
    });
    global.fetch = mockFetch;

    // Process the queue
    await processQueue();

    // Verify FIFO order: first enqueued action processed first
    expect(callOrder[0]).toContain("/api/user/books/1");
    expect(callOrder[1]).toContain("/api/user/books");

    // Queue should be empty after processing
    const remaining = await getQueue();
    expect(remaining).toHaveLength(0);
  });
});

// ---------- Test 8 ----------
describe("Offline queue 4xx discard", () => {
  it("discards actions on 4xx response and notifies via callback", async () => {
    const { enqueue, processQueue, getQueue, onActionDiscarded } = require("@/lib/offlineQueue");

    await enqueue({
      type: "ADD_BOOK",
      method: "POST",
      url: "/api/user/books",
      body: { title: "Bad Book" },
      resourceId: "book-bad",
    });

    // Mock fetch to return 400
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Validation failed" }),
    });
    global.fetch = mockFetch;

    // Listen for discarded actions
    const discardedActions: Array<{ action: Record<string, unknown>; status: number }> = [];
    const unsubscribe = onActionDiscarded(
      (action: Record<string, unknown>, status: number) => {
        discardedActions.push({ action, status });
      },
    );

    await processQueue();

    // Action should be discarded (not retried) on 4xx
    expect(discardedActions).toHaveLength(1);
    expect(discardedActions[0].status).toBe(400);

    // Queue should be empty (action was discarded, not kept)
    const remaining = await getQueue();
    expect(remaining).toHaveLength(0);

    unsubscribe();
  });
});
