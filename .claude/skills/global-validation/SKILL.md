---
name: Input Validation
description: Standards for validating user input in API routes and forms. Use when handling user-submitted data, query parameters, or request bodies.
---

# Input Validation

## When to use this skill:
- Validating API request bodies
- Parsing query parameters
- Handling form submissions
- Type-narrowing unknown data

## API Request Body Validation

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate required fields
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json(
      { error: "Title is required and must be a string" },
      { status: 400 }
    );
  }

  if (!body.status || !["READING", "COMPLETED", "WANT_TO_READ", "DNF"].includes(body.status)) {
    return NextResponse.json(
      { error: "Invalid status value" },
      { status: 400 }
    );
  }

  // Optional field validation
  if (body.pageCount !== undefined && (typeof body.pageCount !== "number" || body.pageCount < 0)) {
    return NextResponse.json(
      { error: "Page count must be a positive number" },
      { status: 400 }
    );
  }

  // Proceed with validated data
}
```

## Query Parameter Validation

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse with defaults
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

  // Validate enum values
  const status = searchParams.get("status");
  const validStatuses = ["READING", "COMPLETED", "WANT_TO_READ", "DNF"] as const;
  if (status && !validStatuses.includes(status as typeof validStatuses[number])) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  // Parse year
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
  if (isNaN(year) || year < 1900 || year > 2100) {
    return NextResponse.json(
      { error: "Invalid year" },
      { status: 400 }
    );
  }
}
```

## Type Guard Functions

```typescript
// Type guard for book data
interface BookInput {
  title: string;
  authors: string;
  isbn?: string;
  pageCount?: number;
}

function isValidBookInput(data: unknown): data is BookInput {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== "string" || obj.title.trim() === "") return false;
  if (typeof obj.authors !== "string" || obj.authors.trim() === "") return false;
  if (obj.isbn !== undefined && typeof obj.isbn !== "string") return false;
  if (obj.pageCount !== undefined && typeof obj.pageCount !== "number") return false;

  return true;
}

// Usage
const body = await request.json();
if (!isValidBookInput(body)) {
  return NextResponse.json({ error: "Invalid book data" }, { status: 400 });
}
// body is now typed as BookInput
```

## Validation Helper

```typescript
// src/lib/validation.ts
type ValidationResult = { valid: true } | { valid: false; error: string };

export function validateRequired(value: unknown, fieldName: string): ValidationResult {
  if (value === undefined || value === null || value === "") {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}

export function validateString(value: unknown, fieldName: string): ValidationResult {
  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  return { valid: true };
}

export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string
): ValidationResult {
  if (!allowedValues.includes(value as T)) {
    return {
      valid: false,
      error: `${fieldName} must be one of: ${allowedValues.join(", ")}`
    };
  }
  return { valid: true };
}
```

## Form Validation Pattern

```tsx
"use client";

interface FormErrors {
  [key: string]: string | undefined;
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  const title = data.get("title");
  if (!title || typeof title !== "string" || title.trim() === "") {
    errors.title = "Title is required";
  }

  const pageCount = data.get("pageCount");
  if (pageCount) {
    const num = parseInt(pageCount.toString());
    if (isNaN(num) || num < 1) {
      errors.pageCount = "Page count must be a positive number";
    }
  }

  return errors;
}

function BookForm() {
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Submit valid data
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" aria-invalid={!!errors.title} />
      {errors.title && <span className="text-red-600">{errors.title}</span>}
    </form>
  );
}
```

## Sanitization

```typescript
// Trim and sanitize string inputs
function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim();
}

// Sanitize for database storage
const title = sanitizeString(body.title);
const authors = sanitizeString(body.authors);

// Note: Prisma handles SQL injection via parameterized queries
// XSS is handled by React's automatic escaping
```
