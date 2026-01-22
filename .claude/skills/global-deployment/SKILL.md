---
name: Deployment
description: Deployment standards for Next.js on Vercel with Neon PostgreSQL. Use when configuring builds, environment variables, or deployment workflows.
---

# Deployment

## When to use this skill:
- Configuring production environment variables
- Understanding the build process
- Deploying to Vercel
- Managing database migrations in production

## Build Process

```bash
# Local development
npm run dev          # Starts Turbopack dev server

# Production build
npm run build        # Runs: prisma generate && next build

# Production start
npm run start        # Serves built application
```

## Environment Variables

### Required for Production

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="random-32-char-secret"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"

# Google Books API
GOOGLE_BOOKS_API_KEY="xxx"
```

### Optional

```env
ADMIN_EMAILS="admin@example.com,admin2@example.com"
DEBUG="false"
SESSION_MAX_AGE="15552000"  # 6 months in seconds
```

## Vercel Configuration

```json
// vercel.json (if needed)
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

## Database Migrations

```bash
# Development: Create and apply migrations
npx prisma migrate dev --name description

# Production: Apply pending migrations
npx prisma migrate deploy

# Vercel: Add to build command or use postbuild script
# package.json
{
  "scripts": {
    "postbuild": "prisma migrate deploy"
  }
}
```

## Deployment Checklist

1. **Environment Variables**: All required vars set in Vercel dashboard
2. **Database**: Migrations applied (`prisma migrate deploy`)
3. **OAuth**: Callback URLs configured in Google Cloud Console
   - `https://your-domain.com/api/auth/callback/google`
4. **Build**: `npm run build` succeeds locally
5. **Lint**: `npm run lint` passes

## Image Optimization

Configure allowed remote image domains in `next.config.ts`:

```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      // Add other book cover sources
    ],
  },
};
```

## Serverless Considerations

```typescript
// Prisma client singleton prevents connection exhaustion
// src/lib/prisma.ts is already configured for this

// API routes are serverless functions
// - Cold starts may occur
// - Keep response times under 10s (Vercel limit)
// - Use connection pooling (Neon provides this)
```

## Monitoring (Future)

```typescript
// Consider adding:
// - Vercel Analytics for performance
// - Sentry for error tracking
// - Database query logging in development

// prisma.ts with logging
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"],
});
```
