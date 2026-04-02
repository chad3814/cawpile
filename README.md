# Cawpile - Book Reading Tracker

A comprehensive book tracking application with the CAWPILE rating system, multi-provider book search, reading progress monitoring, analytics charts, video recaps, and administrative features.

## Features

### Core Features
- **Personal Library Management** - Track your reading with statuses: Want to Read, Reading, Completed, DNF
- **CAWPILE Rating System** - Rate books on 7 dimensions with tailored criteria for fiction and non-fiction
- **Multi-Provider Book Search** - Search across Google Books, Hardcover.app, IBDB, and your local library simultaneously
- **Reading Progress** - Monitor your reading sessions with page tracking and timestamps
- **Analytics Charts** - 11 chart types covering reading habits, diversity metrics, and trends
- **Monthly Video Recaps** - TikTok-style animated recaps of your monthly reading via Remotion
- **Public Profiles** - Shareable user profiles at `/u/[username]` with privacy controls
- **Social Sharing** - Share reviews with customizable image templates
- **Data Export** - CSV/ZIP export of your reading data
- **Admin Dashboard** - Book and user management with full audit logging

### CAWPILE Rating
Rate books across 7 facets (1-10 scale):

**Fiction**: Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment
**Non-Fiction**: Credibility, Authenticity, Writing, Personal Impact, Intrigue, Logic, Enjoyment

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, TailwindCSS 4
- **Backend**: Next.js API Routes, Prisma v6
- **Database**: PostgreSQL (Neon serverless)
- **Auth**: NextAuth v5 with Google OAuth
- **Charts**: Recharts
- **UI**: Headless UI, Heroicons
- **Storage**: AWS S3 (avatars, cover images, video recap backgrounds)
- **Video**: Remotion (separate service in `services/video-gen`)
- **Build**: Turbopack

## Monorepo Structure

This repo contains two independently deployable services:

- **Root (Next.js app)** - Deployed to Vercel
- **services/video-gen** - Remotion + Express video render server, deployed to EC2 via Docker/GHCR/Watchtower

The video-gen service has its own `package.json`, `node_modules`, and `CLAUDE.md`. It uses React 18 (Remotion requirement), not React 19.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google OAuth credentials
- Google Books API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chad3814/cawpile.git
cd cawpile
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

See `.env.example` for the full list with descriptions. Key required variables:
```env
DATABASE_URL=              # PostgreSQL connection string
GOOGLE_CLIENT_ID=          # Google OAuth client ID
GOOGLE_CLIENT_SECRET=      # Google OAuth client secret
NEXTAUTH_URL=              # Your app URL (http://localhost:3000 for dev)
NEXTAUTH_SECRET=           # Random secret for session encryption
GOOGLE_BOOKS_API_KEY=      # Google Books API key
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Development Commands

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production (runs prisma generate automatically)
npm run start        # Start production server
npm run lint         # Run ESLint (cascades into video-gen)
npm run test         # Run all Jest tests (cascades into video-gen Vitest)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run make-admin   # Promote a user to admin
```

### Database
```bash
npx prisma migrate dev   # Create and apply migrations
npx prisma db push       # Push schema changes without migrations (dev only)
npx prisma studio        # Open database GUI
```

### Video Gen Service
```bash
cd services/video-gen
npm install              # Install separately (own node_modules)
npm run server           # Express server on port 3001
npm run dev              # Remotion Studio preview
npm run test             # Run Vitest tests
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # RESTful API routes
│   ├── admin/             # Admin panel pages
│   ├── auth/              # Authentication pages
│   └── dashboard/         # User dashboard (includes templates/)
├── components/            # React components by domain
│   ├── admin/            # Admin components
│   ├── charts/           # Analytics chart components
│   ├── dashboard/        # Dashboard components
│   ├── forms/            # Reusable form field components
│   ├── modals/           # Modal dialogs (AddBookWizard, SearchModal)
│   ├── rating/           # CAWPILE rating components
│   └── templates/        # Video template editor/browser
├── contexts/             # React contexts (ChartDataContext)
├── hooks/                # Custom hooks
├── lib/
│   ├── auth/             # Admin auth helpers
│   ├── db/               # Database utilities (findOrCreateBook, findOrCreateEdition)
│   ├── export/           # CSV/ZIP data export
│   ├── search/           # Multi-provider search system
│   │   ├── providers/   # Google Books, Hardcover, IBDB, Local DB
│   │   └── utils/       # Merging, fuzzy matching, signing
│   ├── video/            # Video template utilities
│   └── charts/           # Chart data processors
└── types/                # TypeScript type definitions

services/video-gen/        # Remotion video render service (separate deployable)
__tests__/                 # Jest tests mirroring src/ structure
```

## License

MIT License — see [LICENSE](LICENSE) for details.
