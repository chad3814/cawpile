---
name: Responsive Design
description: Standards for mobile-first responsive design with TailwindCSS. Use when implementing layouts that need to work across mobile, tablet, and desktop breakpoints.
---

# Responsive Design

## When to use this skill:
- Creating layouts that work on mobile and desktop
- Implementing responsive navigation
- Adjusting component sizes for different screens
- Building responsive grids and tables

## Breakpoint Reference

| Prefix | Min Width | Typical Device |
|--------|-----------|----------------|
| (none) | 0px | Mobile (default) |
| `sm:` | 640px | Large mobile |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |

## Mobile-First Pattern

```tsx
// Start with mobile styles, add breakpoints for larger screens
<div className="
  p-4              // Mobile padding
  md:p-6           // Tablet padding
  lg:p-8           // Desktop padding
">
  <h1 className="
    text-xl          // Mobile: smaller heading
    md:text-2xl      // Tablet+: larger heading
  ">
    Page Title
  </h1>
</div>
```

## Responsive Navigation

```tsx
"use client";

import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="font-semibold">Cawpile</div>

          {/* Desktop nav - hidden on mobile */}
          <div className="hidden md:flex md:gap-6">
            <a href="/dashboard">Dashboard</a>
            <a href="/charts">Charts</a>
            <a href="/settings">Settings</a>
          </div>

          {/* Mobile menu button - hidden on desktop */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu - slides down */}
      {isOpen && (
        <div className="border-t md:hidden">
          <div className="space-y-1 px-4 py-2">
            <a href="/dashboard" className="block py-2">Dashboard</a>
            <a href="/charts" className="block py-2">Charts</a>
            <a href="/settings" className="block py-2">Settings</a>
          </div>
        </div>
      )}
    </nav>
  );
}
```

## Responsive Grid

```tsx
// Book grid: 1 col mobile, 2 cols tablet, 3-4 cols desktop
<div className="
  grid gap-4
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
">
  {books.map((book) => (
    <BookCard key={book.id} book={book} />
  ))}
</div>
```

## Responsive Sidebar Layout

```tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Sidebar - hidden on mobile, fixed on desktop */}
      <aside className="
        hidden
        lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col
        border-r bg-gray-50
      ">
        <nav className="flex-1 p-4">
          {/* Sidebar navigation */}
        </nav>
      </aside>

      {/* Main content - full width mobile, offset on desktop */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

## Responsive Table

```tsx
// Table on desktop, cards on mobile
export function BookList({ books }: { books: UserBook[] }) {
  return (
    <>
      {/* Mobile: Card view */}
      <div className="space-y-4 md:hidden">
        {books.map((book) => (
          <div key={book.id} className="rounded border p-4">
            <h3 className="font-medium">{book.title}</h3>
            <p className="text-sm text-gray-600">{book.author}</p>
            <p className="mt-2 text-sm">{book.status}</p>
          </div>
        ))}
      </div>

      {/* Desktop: Table view */}
      <table className="hidden w-full md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="py-3 font-medium">Title</th>
            <th className="py-3 font-medium">Author</th>
            <th className="py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id} className="border-b">
              <td className="py-3">{book.title}</td>
              <td className="py-3">{book.author}</td>
              <td className="py-3">{book.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

## Responsive Visibility

```tsx
// Show/hide at different breakpoints
<div className="block md:hidden">Mobile only</div>
<div className="hidden md:block lg:hidden">Tablet only</div>
<div className="hidden lg:block">Desktop only</div>

// Conditional rendering based on breakpoint (client-side)
"use client";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function Component() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return isMobile ? <MobileView /> : <DesktopView />;
}
```
