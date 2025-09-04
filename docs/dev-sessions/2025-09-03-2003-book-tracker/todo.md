# Book Tracker - Implementation Todo List

## 🏗️ Foundation Setup (Steps 1-2)
- [ ] Set up Neon PostgreSQL database on Vercel
- [x] Install Prisma and configure connection
- [x] Create initial User/Account/Session schema
- [x] Install and configure NextAuth.js v5
- [ ] Set up Google OAuth credentials
- [x] Configure 6-month session persistence
- [ ] Test authentication flow

## 🎨 UI Structure (Steps 3-4)
- [x] Create Header component with navigation
- [x] Build UserMenu dropdown component
- [x] Implement protected route middleware
- [x] Create landing page with features
- [x] Build sign-in page with Google OAuth
- [x] Add loading and error states
- [ ] Test auth flow end-to-end

## 📚 Data Layer (Steps 5-6)
- [ ] Extend Prisma schema with Book models
- [ ] Add Edition and GoogleBook tables
- [ ] Create UserBook relationship model
- [ ] Add status and format enums
- [ ] Set up Google Books API key
- [ ] Create googleBooks service layer
- [ ] Build /api/books/search endpoint
- [ ] Test book search functionality

## 🔍 Book Search (Steps 7-8)
- [ ] Install Headless UI and Heroicons
- [ ] Create BookSearchModal component
- [ ] Implement useBookSearch hook with debounce
- [ ] Build search results display
- [ ] Create AddBookWizard component
- [ ] Implement status/format selection step
- [ ] Add date picker steps
- [ ] Build progress input step
- [ ] Create completion confirmation step

## 📖 Book Management (Step 9)
- [ ] Create POST /api/user/books endpoint
- [ ] Create GET /api/user/books endpoint
- [ ] Implement findOrCreateBook utility
- [ ] Implement findOrCreateEdition utility
- [ ] Add deduplication logic
- [ ] Handle API errors properly
- [ ] Test adding books to library

## 📊 Dashboard (Steps 10-11)
- [ ] Create dashboard page with auth check
- [ ] Build BookGrid component
- [ ] Create BookCard component
- [ ] Design EmptyLibrary component
- [ ] Add loading skeletons
- [ ] Wire search modal to wizard
- [ ] Connect wizard to API
- [ ] Implement optimistic updates
- [ ] Add dashboard refresh after adding

## ✨ Enhancements (Steps 12-14)
- [ ] Create UpdateProgressModal component
- [ ] Add PATCH endpoint for progress
- [ ] Build progress calculation utilities
- [ ] Create ErrorBoundary component
- [ ] Add error states to all components
- [ ] Implement loading spinners
- [ ] Optimize for mobile
- [ ] Add keyboard navigation
- [ ] Performance optimizations
- [ ] Final code cleanup

## ✅ Testing Checklist
- [ ] Google OAuth sign in/out
- [ ] Book search functionality
- [ ] Add book with all statuses
- [ ] Dashboard displays correctly
- [ ] Progress updates work
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Keyboard navigation

## 🎯 Definition of Done
- [ ] All features working on desktop
- [ ] All features working on mobile
- [ ] No console errors
- [ ] TypeScript fully typed
- [ ] Database properly indexed
- [ ] 6-month sessions persist
- [ ] Errors handled gracefully