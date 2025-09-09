# Cawpile - Book Reading Tracker

## 📚 Project Overview

**Cawpile** is a comprehensive book tracking and rating application that helps users manage their reading journey with advanced features including the CAWPILE rating system, reading progress tracking, and an administrative dashboard for data management.

### Core Purpose
- Track personal reading library and progress
- Rate books using the CAWPILE methodology (Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment)
- Monitor reading habits and set goals
- Manage book metadata and user data (admin features)

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Framework**: Next.js 15.5.2 (App Router architecture)
- **UI Library**: React 19.1.0
- **Styling**: TailwindCSS 4 with PostCSS
- **Component Library**: HeadlessUI, Heroicons
- **TypeScript**: Full type safety with strict mode

#### Backend
- **API**: Next.js API Routes (App Router)
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Prisma 6.15.0
- **Authentication**: NextAuth v5 beta with Google OAuth

#### Development Tools
- **Build**: Turbopack (Next.js bundler)
- **Linting**: ESLint with Next.js config
- **TypeScript**: Strict configuration with path aliases

## 📁 Project Structure

```
cawpile/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── admin/          # Admin endpoints
│   │   │   ├── auth/           # Authentication
│   │   │   ├── books/          # Book search
│   │   │   ├── reading-sessions/ # Reading tracking
│   │   │   └── user/           # User book management
│   │   ├── admin/              # Admin panel pages
│   │   │   ├── audit-log/      # Activity tracking
│   │   │   ├── books/          # Book management
│   │   │   └── users/          # User management
│   │   ├── auth/               # Authentication pages
│   │   └── dashboard/          # User dashboard
│   ├── components/             # React components
│   │   ├── admin/              # Admin-specific components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── layout/             # Layout components
│   │   ├── modals/             # Modal components
│   │   └── rating/             # CAWPILE rating components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Core utilities
│   │   ├── audit/              # Audit logging
│   │   ├── auth/               # Auth utilities
│   │   └── db/                 # Database operations
│   └── types/                  # TypeScript definitions
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── public/                     # Static assets
└── scripts/                    # Utility scripts
```

## 🗃️ Database Schema

### Core Models

#### User System
- **User**: Authentication and profile data
- **Account**: OAuth provider accounts
- **Session**: Active user sessions

#### Book Management
- **Book**: Core book entity (title, authors, type)
- **Edition**: Specific editions with ISBNs
- **GoogleBook**: Google Books API metadata
- **UserBook**: User's relationship with books

#### Reading Features
- **CawpileRating**: 7-facet rating system
- **ReadingSession**: Progress tracking
- **AdminAuditLog**: Admin activity tracking

### Key Relationships
- Users → UserBooks → Editions → Books
- UserBooks → CawpileRatings (1:1)
- UserBooks → ReadingSessions (1:many)
- Editions → GoogleBook (1:1)

## 🔑 Key Features

### User Features

#### 📖 Reading Management
- Add books via Google Books API search
- Track reading status (Want to Read, Reading, Completed, DNF)
- Monitor progress with page tracking
- Log reading sessions with timestamps

#### ⭐ CAWPILE Rating System
- **Fiction**: Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment
- **Non-Fiction**: Credibility, Authenticity, Writing, Personal Impact, Intrigue, Logic, Enjoyment
- Automatic star conversion and grade calculation
- Detailed rating guidance for each facet

#### 📊 Dashboard
- Visual book grid with covers
- Filter by reading status
- Progress indicators
- Quick actions for updating books

### Admin Features

#### 👥 User Management
- View all users with statistics
- Toggle admin/super admin privileges
- Monitor user activity

#### 📚 Book Management
- Search and filter books
- Bulk operations (update, delete)
- Edit book metadata
- ISBN validation
- Data quality monitoring

#### 📝 Audit Log
- Track all admin actions
- Field-level change history
- Filterable by entity type and admin

#### 📈 Statistics Dashboard
- Total users and books
- Reading activity metrics
- Data quality indicators

## 🔐 Authentication & Security

### Authentication Flow
1. Google OAuth via NextAuth
2. JWT session strategy (6-month duration)
3. Prisma adapter for database persistence
4. Custom sign-in page

### Authorization Levels
- **Regular User**: Personal library management
- **Admin**: Book and user management
- **Super Admin**: Full system access

### Security Features
- Protected API routes with auth checks
- Admin access validation middleware
- Audit logging for accountability
- Environment-based configuration

## 🚀 Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Common Commands
- `npm run dev` - Development with Turbopack
- `npm run build` - Production build
- `npm run lint` - Code quality checks
- `npm run make-admin` - Create admin user

### Environment Variables
```env
DATABASE_URL=           # PostgreSQL connection
GOOGLE_CLIENT_ID=       # OAuth credentials
GOOGLE_CLIENT_SECRET=   
NEXTAUTH_URL=          # App URL
NEXTAUTH_SECRET=       # Session encryption
GOOGLE_BOOKS_API_KEY=  # Books API access
```

## 🎨 UI/UX Design

### Component Architecture
- Modular component structure
- Responsive design with mobile support
- Dark mode compatible styling
- Accessible UI with HeadlessUI

### Key UI Components
- **BookCard**: Visual book representation
- **BookSearchModal**: Google Books integration
- **AddBookWizard**: Multi-step book addition
- **CawpileRatingModal**: Interactive rating interface
- **AdminNav**: Role-based navigation

### Styling System
- TailwindCSS utility-first approach
- Custom color variables
- Geist font family (sans & mono)
- Consistent spacing and typography

## 📊 Data Flow

### Book Addition Flow
1. User searches via Google Books API
2. Select edition and format
3. Create UserBook entry
4. Link to existing or new Book/Edition

### Rating Flow
1. Complete book (status: COMPLETED)
2. Open CAWPILE rating modal
3. Rate 7 facets (fiction/non-fiction)
4. Calculate average and star rating
5. Store in CawpileRating table

### Admin Operations Flow
1. Authenticate admin user
2. Log action in AdminAuditLog
3. Perform CRUD operation
4. Update data quality metrics

## 🔄 State Management

### Client-Side
- React hooks for local state
- Custom hooks for data fetching
- Optimistic UI updates
- Error boundaries for resilience

### Server-Side
- Server Components for initial data
- API routes for mutations
- Prisma for database operations
- NextAuth for session management

## 📈 Performance Optimizations

- Turbopack for fast builds
- Image optimization with Next.js
- Database indexing strategies
- Efficient query patterns with Prisma
- Component code splitting

## 🚦 Error Handling

- Global error boundaries
- API error responses
- Form validation
- Database constraint handling
- User-friendly error messages

## 📝 Future Enhancements

### Planned Features
- Reading statistics and analytics
- Book recommendations
- Social features (friends, sharing)
- Reading challenges
- Export functionality
- Mobile app development

### Technical Improvements
- Test coverage implementation
- Performance monitoring
- Enhanced caching strategies
- Real-time updates
- Advanced search capabilities

## 🤝 Contributing

### Development Standards
- TypeScript for type safety
- Component-driven development
- Atomic commits
- PR-based workflow
- Code review process

### Code Style
- ESLint configuration
- Consistent naming conventions
- Modular component structure
- Clear documentation

## 📄 License

Private project - All rights reserved

---

**Version**: 0.1.0  
**Last Updated**: September 2024  
**Maintainer**: Development Team