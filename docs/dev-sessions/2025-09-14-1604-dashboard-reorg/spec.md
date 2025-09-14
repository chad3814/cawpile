# Dashboard Layout Toggle Specification

## Overview
Add a layout toggle feature to the user dashboard at `/dashboard` that allows users to switch between the existing card/grid view and a new table view for displaying their books.

## Requirements

### Layout Toggle Control
- **Type**: Icon-based toggle buttons (grid icon and table/list icon)
- **Position**: Right-aligned on the same line as "Your reading dashboard" heading
- **Behavior**: Immediate visual switch with slide transition animation
- **Persistence**: Save preference to database (user profile)
- **Error Handling**: If database save fails, show toast notification but maintain new view state (optimistic UI)

### Table View Layout

#### Columns (no header row)
1. **Cover Image**: Smaller/compact version of book cover
2. **Title**: Book title
3. **Author(s)**: Author name(s)
4. **Status**: Currently reading, DNF, or Completed
5. **Rating**: Star rating display
6. **Ending Month**: Month the book was finished

#### Visual Design
- Visible borders between rows and columns
- No header row (data should be self-evident)
- Tooltips on hover for clarity where needed
- Row hover effect: Lighter background color to indicate clickability

#### Empty States
- Missing cover: Use existing placeholder image
- Missing rating: Display "--"
- Missing ending month: Display "--"
- Other missing data: Display "--"

### Interactions
- **Row Click**: Navigate to book details page (same as card click in grid view)
- **Filtering**: Maintain same filtering capabilities as grid view
- **Pagination**: Same pagination/load more behavior as grid view
- **Sorting**: No sorting functionality needed

### Responsive Design
- **Small Screens**: Each book occupies two rows
  - Cover image spans both rows (rowspan)
  - Top row: Important data (title, author, status)
  - Bottom row: Secondary data (rating, ending month)
- **Breakpoint**: Define appropriate breakpoint for two-row layout

### Technical Considerations
- **State Management**: Toggle state stored in user profile (database)
- **Animation**: Slide transition between views
- **Data**: Use same data source/query as grid view
- **Performance**: Ensure smooth transitions and fast rendering

## Implementation Notes
- Reuse existing book data fetching logic
- Maintain consistency with current grid view features
- Ensure accessibility with proper ARIA labels and keyboard navigation
- Consider using CSS Grid or Flexbox for the two-row mobile layout