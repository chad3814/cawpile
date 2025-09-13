# Cawpile - Book Reading Tracker

A comprehensive book tracking application with the CAWPILE rating system, reading progress monitoring, and administrative features.

## Features

### 📚 Core Features
- **Personal Library Management** - Track your reading with statuses: Want to Read, Reading, Completed, DNF
- **CAWPILE Rating System** - Rate books on 7 dimensions with tailored criteria for fiction and non-fiction
- **Reading Progress** - Monitor your reading sessions with page tracking and timestamps
- **Google Books Integration** - Search and add books with automatic metadata import
- **Admin Dashboard** - Comprehensive book and user management tools

### ⭐ CAWPILE Rating
Rate books across 7 facets:

**Fiction**: Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment
**Non-Fiction**: Credibility, Authenticity, Writing, Personal Impact, Intrigue, Logic, Enjoyment

## Tech Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript, TailwindCSS 4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon serverless)
- **Auth**: NextAuth v5 with Google OAuth
- **Build**: Turbopack

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google OAuth credentials
- Google Books API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cawpile.git
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

Configure the following in `.env.local`:
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
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run make-admin   # Create admin user (custom script)
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin panel
│   ├── auth/              # Authentication pages
│   └── dashboard/         # User dashboard
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── dashboard/        # Dashboard components
│   ├── modals/           # Modal dialogs
│   └── rating/           # CAWPILE rating components
├── lib/                   # Core utilities
│   ├── auth/             # Auth helpers
│   ├── audit/            # Audit logging
│   └── db/               # Database operations
└── types/                # TypeScript definitions
```

## Key Features Explained

### User Dashboard
- Visual book grid with cover images
- Filter books by reading status
- Quick actions for updating progress
- Reading session tracking

### Admin Panel
- User management with role assignment
- Book metadata editing and validation
- Bulk operations support
- Comprehensive audit logging
- Data quality monitoring

### Security
- Protected API routes with authentication checks
- Admin-only endpoints with role validation
- Audit logging for all administrative actions
- JWT session management with 6-month duration

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Standards
- TypeScript for type safety
- Component-driven development
- Atomic commits with clear messages
- ESLint compliance
- Maintain existing code structure

## License

Private project - All rights reserved

---

**Version**: 0.1.0
**Status**: Active Development
**Last Updated**: September 2024
