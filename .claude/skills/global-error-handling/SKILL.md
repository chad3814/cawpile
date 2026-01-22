---
name: Error Handling
description: Standards for error handling in API routes and React components. Use when implementing try/catch blocks, returning error responses, or displaying errors to users.
---

# Error Handling

## When to use this skill:
- Writing try/catch blocks in API routes
- Handling Prisma errors
- Displaying error states in components
- Validating user input

## API Route Error Handling

```typescript
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const result = await prisma.book.create({ data: body });
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error("API Error:", error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A record with this value already exists" },
          { status: 409 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Record not found" },
          { status: 404 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Common Prisma Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| P2002 | Unique constraint violation | 409 Conflict |
| P2025 | Record not found | 404 Not Found |
| P2003 | Foreign key constraint failed | 400 Bad Request |
| P2014 | Required relation violation | 400 Bad Request |

## Client-Side Error Handling

```tsx
"use client";

import { useState } from "react";

export function BookForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(data: FormData) {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      // Success handling
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div role="alert" className="rounded bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

## Error Boundary Pattern

```tsx
// src/components/ErrorBoundary.tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Error caught by boundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <p>Something went wrong.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

## Loading and Error States

```tsx
interface DataState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

function useData<T>(fetchFn: () => Promise<T>): DataState<T> {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    fetchFn()
      .then((data) => setState({ data, isLoading: false, error: null }))
      .catch((err) => setState({
        data: null,
        isLoading: false,
        error: err.message
      }));
  }, []);

  return state;
}
```

## Validation Errors

```typescript
// Return field-specific errors for forms
interface ValidationError {
  field: string;
  message: string;
}

function validateBookInput(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    errors.push({ field: "root", message: "Invalid request body" });
    return errors;
  }

  const body = data as Record<string, unknown>;

  if (!body.title || typeof body.title !== "string") {
    errors.push({ field: "title", message: "Title is required" });
  }

  if (body.pageCount && typeof body.pageCount !== "number") {
    errors.push({ field: "pageCount", message: "Page count must be a number" });
  }

  return errors;
}

// In API route
const errors = validateBookInput(body);
if (errors.length > 0) {
  return NextResponse.json({ errors }, { status: 400 });
}
```
