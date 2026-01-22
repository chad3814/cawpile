---
name: TailwindCSS Styling
description: Standards for styling with TailwindCSS 4. Use when adding styles to components, implementing dark mode, or working with the design system in globals.css.
---

# TailwindCSS Styling

## When to use this skill:
- Adding styles to React components
- Working with responsive design
- Implementing dark mode support
- Using CSS custom properties from `globals.css`
- Creating reusable style patterns

## Basic Patterns

```tsx
// Layout with flexbox
<div className="flex items-center justify-between gap-4">
  <h1 className="text-xl font-semibold">Title</h1>
  <button className="rounded bg-blue-500 px-4 py-2 text-white">
    Action
  </button>
</div>

// Card pattern
<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
  <h2 className="text-lg font-medium">Card Title</h2>
  <p className="mt-2 text-gray-600">Card content</p>
</div>

// Grid layout
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
  {items.map((item) => (
    <div key={item.id} className="rounded border p-4">
      {item.name}
    </div>
  ))}
</div>
```

## Responsive Design

```tsx
// Mobile-first approach
<div className="
  p-4             // Mobile: 1rem padding
  md:p-6          // Tablet: 1.5rem padding
  lg:p-8          // Desktop: 2rem padding
">
  <div className="
    flex flex-col   // Mobile: stack vertically
    md:flex-row     // Tablet+: row layout
    gap-4
  ">
    <aside className="
      w-full          // Mobile: full width
      md:w-64         // Tablet+: fixed sidebar
    ">
      Sidebar
    </aside>
    <main className="flex-1">
      Content
    </main>
  </div>
</div>
```

## Dark Mode

```tsx
// Using prefers-color-scheme (automatic)
<div className="
  bg-white text-gray-900
  dark:bg-gray-900 dark:text-white
">
  <p className="text-gray-600 dark:text-gray-400">
    Secondary text
  </p>
</div>

// CSS variables from globals.css
<div className="bg-[var(--background)] text-[var(--foreground)]">
  Uses CSS custom properties
</div>
```

## Common Component Styles

```tsx
// Button variants
const buttonStyles = {
  primary: "bg-blue-500 text-white hover:bg-blue-600",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  danger: "bg-red-500 text-white hover:bg-red-600",
  ghost: "text-gray-600 hover:bg-gray-100",
};

// Input styles
<input className="
  w-full rounded-md border border-gray-300 px-3 py-2
  focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
  disabled:bg-gray-50 disabled:text-gray-500
" />

// Form label
<label className="block text-sm font-medium text-gray-700">
  Label Text
</label>
```

## Conditional Classes

```tsx
import { cn } from "@/lib/utils";  // or use clsx/classnames

// With cn utility
<button className={cn(
  "rounded px-4 py-2 font-medium",
  variant === "primary" && "bg-blue-500 text-white",
  variant === "secondary" && "bg-gray-100 text-gray-900",
  isDisabled && "cursor-not-allowed opacity-50"
)}>
  {label}
</button>

// Inline conditional
<div className={`
  rounded border p-4
  ${isActive ? "border-blue-500 bg-blue-50" : "border-gray-200"}
`}>
  Content
</div>
```

## Animation Classes

```tsx
// Transitions
<button className="
  transition-colors duration-200
  hover:bg-blue-600
">
  Hover me
</button>

// Transform on hover
<div className="
  transition-transform duration-200
  hover:scale-105
">
  Card
</div>

// Loading spinner
<svg className="h-5 w-5 animate-spin text-white">
  {/* spinner SVG */}
</svg>
```

## Spacing Reference

| Class | Value |
|-------|-------|
| `p-1` | 0.25rem (4px) |
| `p-2` | 0.5rem (8px) |
| `p-4` | 1rem (16px) |
| `p-6` | 1.5rem (24px) |
| `p-8` | 2rem (32px) |
| `gap-4` | 1rem between items |

## Typography Reference

| Class | Usage |
|-------|-------|
| `text-sm` | Small text, labels |
| `text-base` | Body text (default) |
| `text-lg` | Subheadings |
| `text-xl` | Section headings |
| `text-2xl` | Page titles |
| `font-medium` | Semi-emphasis |
| `font-semibold` | Strong emphasis |
