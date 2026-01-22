---
name: Testing
description: Standards for writing tests with Jest and React Testing Library. Use when creating tests in __tests__/, testing components, or testing utility functions.
---

# Testing

## When to use this skill:
- Writing unit tests for utility functions
- Testing React components
- Testing API route handlers
- Setting up test fixtures

## Test File Location

```
__tests__/
├── components/     # Component tests
│   ├── BookCard.test.tsx
│   └── PublicReviewDisplay.test.tsx
├── lib/            # Utility function tests
│   ├── sanitize.test.ts
│   └── fuzzyMatch.test.ts
└── api/            # API route tests
    └── books.test.ts
```

## Basic Test Structure

```typescript
// __tests__/lib/utils.test.ts
import { calculateAverage, formatDate } from "@/lib/utils";

describe("calculateAverage", () => {
  it("returns average of numbers", () => {
    expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3);
  });

  it("returns 0 for empty array", () => {
    expect(calculateAverage([])).toBe(0);
  });

  it("handles single value", () => {
    expect(calculateAverage([5])).toBe(5);
  });
});

describe("formatDate", () => {
  it("formats ISO date to readable string", () => {
    expect(formatDate("2024-01-15")).toBe("January 15, 2024");
  });
});
```

## Component Testing

```tsx
// __tests__/components/BookCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { BookCard } from "@/components/book/BookCard";

const mockBook = {
  id: "1",
  status: "READING",
  edition: {
    book: { title: "Test Book", authors: "Test Author" },
    coverImage: "/cover.jpg",
  },
};

describe("BookCard", () => {
  it("renders book title and author", () => {
    render(<BookCard book={mockBook} />);

    expect(screen.getByText("Test Book")).toBeInTheDocument();
    expect(screen.getByText("Test Author")).toBeInTheDocument();
  });

  it("calls onEdit when edit button clicked", () => {
    const handleEdit = jest.fn();
    render(<BookCard book={mockBook} onEdit={handleEdit} />);

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    expect(handleEdit).toHaveBeenCalledWith("1");
  });

  it("displays reading status badge", () => {
    render(<BookCard book={mockBook} />);

    expect(screen.getByText("Reading")).toBeInTheDocument();
  });
});
```

## Testing Async Operations

```typescript
// __tests__/lib/api.test.ts
import { fetchUserBooks } from "@/lib/api";

// Mock fetch
global.fetch = jest.fn();

describe("fetchUserBooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches books successfully", async () => {
    const mockBooks = [{ id: "1", title: "Book 1" }];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBooks,
    });

    const result = await fetchUserBooks("user-1");

    expect(fetch).toHaveBeenCalledWith("/api/user/books");
    expect(result).toEqual(mockBooks);
  });

  it("throws on network error", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchUserBooks("user-1")).rejects.toThrow("Network error");
  });
});
```

## Mocking

```typescript
// Mock modules
jest.mock("@/lib/prisma", () => ({
  prisma: {
    userBook: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock auth
jest.mock("@/lib/auth-helpers", () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    id: "user-1",
    email: "test@example.com",
  }),
}));
```

## Testing Hooks

```tsx
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("debounces value changes", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "initial" } }
    );

    expect(result.current).toBe("initial");

    rerender({ value: "updated" });
    expect(result.current).toBe("initial"); // Not yet updated

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated"); // Now updated
  });
});
```

## Running Tests

```bash
# Run all tests
npm run test

# Run specific file
npm run test -- __tests__/lib/utils.test.ts

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

## Common Matchers

```typescript
// Equality
expect(value).toBe(exact);           // Strict equality
expect(value).toEqual(object);       // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThanOrEqual(5);
expect(value).toBeCloseTo(0.3, 5);   // Floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain("substring");

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// DOM (jest-dom)
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toHaveTextContent("text");
expect(element).toHaveAttribute("href", "/path");
```
