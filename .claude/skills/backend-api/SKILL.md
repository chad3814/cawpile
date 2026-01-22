---
name: Next.js API Routes
description: Standards for Next.js 15 App Router API routes. Use when creating or modifying files in src/app/api/, implementing RESTful endpoints, handling authentication in routes, or working with request/response patterns.
---

# Next.js API Routes

## When to use this skill:
- Creating new API endpoints in `src/app/api/`
- Modifying existing route handlers
- Implementing authentication checks in routes
- Handling request validation and responses
- Working with Prisma in API routes

## Route Handler Pattern

```typescript
// src/app/api/resource/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.resource.findMany({
    where: { userId: user.id },
  });

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  // Validate body before use

  const result = await prisma.resource.create({
    data: { ...body, userId: user.id },
  });

  return NextResponse.json(result, { status: 201 });
}
```

## Dynamic Routes

```typescript
// src/app/api/resource/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Use id for lookup
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  // Update resource
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Delete resource
}
```

## Response Standards

```typescript
// Success responses
return NextResponse.json(data);                           // 200 OK (default)
return NextResponse.json(created, { status: 201 });       // 201 Created
return new NextResponse(null, { status: 204 });           // 204 No Content

// Error responses
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
return NextResponse.json({ error: "Forbidden" }, { status: 403 });
return NextResponse.json({ error: "Not found" }, { status: 404 });
return NextResponse.json({ error: "Invalid request" }, { status: 400 });
```

## Admin Route Protection

```typescript
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  // Admin-only logic
}
```

## Query Parameters

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const year = searchParams.get("year");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  // Use parameters in query
}
```

## Error Handling

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await prisma.resource.create({ data: body });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Resource already exists" }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```
