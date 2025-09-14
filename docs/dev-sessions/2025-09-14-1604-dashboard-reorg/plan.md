# Dashboard Layout Toggle Implementation Plan

## Overview
Implement a toggle feature for the dashboard at `/dashboard` to switch between grid (existing) and table (new) views. The implementation will be broken down into small, safe, incremental steps that build on each other.

## Architecture Analysis
- **Current Structure**: Dashboard page fetches data server-side, passes to client-side BookGrid component
- **Database**: Prisma with User model that needs a new preference field
- **UI Framework**: Next.js 15 with TailwindCSS 4
- **State Management**: Need to handle optimistic updates and database persistence

## Implementation Phases

### Phase 1: Database Foundation
Set up the database field to store user preference

### Phase 2: UI Toggle Controls
Create the toggle button components with icons

### Phase 3: Table View Component
Build the table view layout with all required columns

### Phase 4: View Switching Logic
Implement the logic to switch between views with state management

### Phase 5: Database Persistence
Connect the toggle to save preferences to the database

### Phase 6: Animations & Polish
Add slide transitions and hover effects

### Phase 7: Responsive Design
Implement the two-row mobile layout

### Phase 8: Integration & Testing
Wire everything together and ensure all features work

---

## LLM Implementation Prompts

### Prompt 1: Database Schema Update
**Context**: We need to add a field to the User model to store the dashboard layout preference.

**Task**: Update the Prisma schema to add a `dashboardLayout` field to the User model. This field should:
- Be an enum with values 'GRID' and 'TABLE'
- Default to 'GRID' to maintain current behavior
- Be optional to handle existing users

**File to modify**: `prisma/schema.prisma`

**Implementation**:
1. Add the enum definition near the other enums
2. Add the field to the User model
3. Create a migration

```prisma
enum DashboardLayout {
  GRID
  TABLE
}

// In User model, add:
dashboardLayout DashboardLayout @default(GRID)
```

---

### Prompt 2: Create Icon Components
**Context**: We need icon components for the grid and table views to use in our toggle buttons.

**Task**: Create two simple SVG icon components:
1. GridIcon - for the grid/card view
2. TableIcon - for the table/list view

**Files to create**:
- `src/components/icons/GridIcon.tsx`
- `src/components/icons/TableIcon.tsx`

**Implementation**: Create simple, clean SVG icons that are 20x20px, using currentColor for the fill/stroke so they inherit text color. Make them React components that accept className props.

---

### Prompt 3: Create Layout Toggle Component
**Context**: We have icon components and need a toggle control that will be positioned on the right side of the dashboard heading.

**Task**: Create a LayoutToggle component that:
- Shows two icon buttons (grid and table)
- Highlights the active view
- Accepts `currentLayout` and `onLayoutChange` props
- Uses proper ARIA labels for accessibility

**File to create**: `src/components/dashboard/LayoutToggle.tsx`

**Implementation**: Use a button group pattern with clear visual indication of the selected state. Add hover effects and ensure keyboard navigation works.

---

### Prompt 4: Create BookTable Component (Basic Structure)
**Context**: We need a table view component to display books as an alternative to the existing BookGrid.

**Task**: Create a BookTable component that:
- Accepts the same `books` prop as BookGrid
- Creates a table structure with visible borders
- Shows columns for: cover, title, author(s), status, rating, ending month
- Has no header row
- Makes entire rows clickable to navigate to book details

**File to create**: `src/components/dashboard/BookTable.tsx`

**Implementation**: Start with a basic table structure. Use the same book data interface as BookGrid. For now, just display the data without fancy styling.

---

### Prompt 5: Add BookTable Styling and Empty States
**Context**: We have a basic BookTable component that needs proper styling and empty state handling.

**Task**: Enhance the BookTable component to:
- Add visible borders between rows and columns
- Show "--" for missing data (rating, ending month)
- Add row hover effect (lighter background)
- Use existing placeholder image for missing covers
- Add tooltips on hover for clarity

**File to modify**: `src/components/dashboard/BookTable.tsx`

**Implementation**: Use TailwindCSS classes for styling. Import and use the same placeholder image logic from BookCard if it exists.

---

### Prompt 6: Create ViewSwitcher Component
**Context**: We need a component that manages switching between BookGrid and BookTable views.

**Task**: Create a ViewSwitcher component that:
- Accepts books data and current layout preference
- Renders either BookGrid or BookTable based on the layout
- Maintains the same "Currently Reading" and "Library" sections
- Prepares for animation (wrap in a container div)

**File to create**: `src/components/dashboard/ViewSwitcher.tsx`

**Implementation**: This component orchestrates the view logic but doesn't handle state management yet. It's a presentational component.

---

### Prompt 7: Update Dashboard Page (Client Component)
**Context**: The dashboard page is currently a server component. We need to make the interactive parts client-side while keeping data fetching server-side.

**Task**: Refactor the dashboard page to:
- Keep data fetching server-side
- Create a client component wrapper for the interactive parts
- Add state management for layout preference
- Integrate LayoutToggle and ViewSwitcher components

**Files to modify/create**:
- `src/app/dashboard/page.tsx` (keep server-side)
- `src/components/dashboard/DashboardClient.tsx` (new client component)

**Implementation**: Use the "use client" directive appropriately. Pass server-fetched data to client component.

---

### Prompt 8: Add API Route for Preference Saving
**Context**: We need an API endpoint to save the user's layout preference to the database.

**Task**: Create an API route that:
- Accepts a PATCH request with the new layout preference
- Updates the user's dashboardLayout field in the database
- Returns success/error status
- Includes proper authentication checks

**File to create**: `src/app/api/user/preferences/route.ts`

**Implementation**: Use the existing auth helpers to get the current user. Update only the dashboardLayout field.

---

### Prompt 9: Connect Preference Saving with Optimistic Updates
**Context**: We have an API route and need to connect it to our UI with optimistic updates.

**Task**: Update the DashboardClient component to:
- Save preference when toggle is clicked
- Implement optimistic updates (change immediately, save in background)
- Show toast notification on save failure
- Keep the new state even if save fails

**File to modify**: `src/components/dashboard/DashboardClient.tsx`

**Implementation**: Use fetch API to call our endpoint. You'll need to add a toast notification system or use console.error for now.

---

### Prompt 10: Add Slide Transition Animation
**Context**: We want a smooth slide transition when switching between views.

**Task**: Add animation to the ViewSwitcher component:
- Implement a slide transition between grid and table views
- Use CSS transitions or a React animation library
- Ensure the animation is smooth and not jarring

**File to modify**: `src/components/dashboard/ViewSwitcher.tsx`

**Implementation**: Use CSS transitions with transform and opacity. Consider using a wrapper div with overflow hidden.

---

### Prompt 11: Implement Responsive Table Layout
**Context**: The table needs a special two-row layout on mobile devices.

**Task**: Update BookTable component to:
- Detect mobile viewport (use Tailwind breakpoints)
- Show each book in two rows on mobile:
  - Cover image spans both rows
  - First row: title, author, status
  - Second row: rating, ending month
- Maintain single row on desktop

**File to modify**: `src/components/dashboard/BookTable.tsx`

**Implementation**: Use CSS Grid or careful table restructuring with responsive classes. Ensure it looks good at all breakpoints.

---

### Prompt 12: Add Status Badge Formatting
**Context**: The status column needs better visual formatting to match the card view.

**Task**: Create a StatusBadge component and integrate it into BookTable:
- Show "Currently Reading", "DNF", "Completed" with appropriate colors
- Match the visual style from BookCard if it has status badges
- Ensure consistency across both views

**Files to create/modify**:
- `src/components/ui/StatusBadge.tsx` (if doesn't exist)
- `src/components/dashboard/BookTable.tsx`

**Implementation**: Create reusable badge component with color coding for each status.

---

### Prompt 13: Implement Star Rating Display
**Context**: The table needs to show star ratings similar to the card view.

**Task**: Create or reuse a StarRating component for the table:
- Display rating as filled/empty stars
- Handle null ratings (show "--")
- Keep it compact for table view
- Ensure it's visually consistent with card view

**Files to create/modify**:
- `src/components/ui/StarRating.tsx` (if doesn't exist)
- `src/components/dashboard/BookTable.tsx`

**Implementation**: Create a simple star display component that can work in both card and table contexts.

---

### Prompt 14: Add Cover Image Optimization
**Context**: Table view needs smaller cover images for performance.

**Task**: Optimize cover image display in BookTable:
- Use smaller image size (thumbnail)
- Add lazy loading
- Handle missing images with placeholder
- Ensure proper aspect ratio

**File to modify**: `src/components/dashboard/BookTable.tsx`

**Implementation**: Use Next.js Image component with appropriate sizing. Consider using a smaller image URL if available from the data source.

---

### Prompt 15: Final Integration and Testing
**Context**: All components are built. Time to ensure everything works together.

**Task**: Final integration checklist:
- Verify toggle switches views correctly
- Confirm preference saves to database
- Test optimistic updates work
- Ensure animations are smooth
- Verify responsive layout works
- Test keyboard navigation
- Check empty states
- Ensure consistent data between views

**Files to review**: All created/modified files

**Implementation**: Do a full walkthrough of the feature, fix any remaining issues.

---

## Testing Checklist
- [ ] Toggle switches between views
- [ ] Preference persists on page reload
- [ ] Preference syncs across browser tabs
- [ ] Table shows all required data
- [ ] Empty states display correctly
- [ ] Row click navigation works
- [ ] Hover effects work
- [ ] Responsive layout switches to two-row
- [ ] Animation is smooth
- [ ] Accessibility (keyboard navigation, ARIA labels)
- [ ] Error handling (failed save shows toast)