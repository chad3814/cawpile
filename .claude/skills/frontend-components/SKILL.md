---
name: React Components
description: Standards for React 19 components with Next.js 15 App Router. Use when creating components in src/components/, working with Server vs Client components, or implementing component patterns like modals and wizards.
---

# React Components

## When to use this skill:
- Creating new components in `src/components/`
- Deciding between Server and Client components
- Implementing modals, forms, or wizards
- Working with component props and TypeScript
- Managing component state

## Server vs Client Components

```tsx
// Server Component (default) - no "use client" directive
// Use for: data fetching, static content, no interactivity
// Location: page.tsx, layout.tsx, data-display components

export default async function BookList() {
  const books = await prisma.book.findMany();
  return (
    <ul>
      {books.map((book) => (
        <li key={book.id}>{book.title}</li>
      ))}
    </ul>
  );
}

// Client Component - add "use client" at top
// Use for: interactivity, hooks, browser APIs, event handlers
"use client";

import { useState } from "react";

export function SearchInput() {
  const [query, setQuery] = useState("");
  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

## Component File Structure

```tsx
// src/components/book/BookCard.tsx
"use client";

import { useState } from "react";
import type { UserBook } from "@/types/book";

interface BookCardProps {
  book: UserBook;
  onStatusChange?: (status: string) => void;
}

export function BookCard({ book, onStatusChange }: BookCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{book.edition.book.title}</h3>
      {/* Component content */}
    </div>
  );
}
```

## Props Pattern

```tsx
// Define props interface above component
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "rounded font-medium",
        variants[variant],
        sizes[size]
      )}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
```

## Modal Pattern

```tsx
// src/components/modals/EditBookModal.tsx
"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: UserBook;
  onSave: (data: BookData) => Promise<void>;
}

export function EditBookModal({ isOpen, onClose, book, onSave }: EditBookModalProps) {
  const [formData, setFormData] = useState(book);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop and panel */}
      <DialogPanel>
        <DialogTitle>Edit Book</DialogTitle>
        <form onSubmit={handleSubmit}>
          {/* Form fields */}
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </form>
      </DialogPanel>
    </Dialog>
  );
}
```

## Wizard Pattern (Multi-step Form)

```tsx
// src/components/modals/AddBookWizard.tsx
"use client";

import { useState } from "react";

type Step = "status" | "format" | "tracking" | "dates";

export function AddBookWizard({ onComplete }: { onComplete: (data: BookData) => void }) {
  const [step, setStep] = useState<Step>("status");
  const [data, setData] = useState<Partial<BookData>>({});

  const steps: Step[] = ["status", "format", "tracking", "dates"];
  const currentIndex = steps.indexOf(step);

  function nextStep() {
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  }

  function prevStep() {
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  }

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex gap-2 mb-4">
        {steps.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-2 flex-1 rounded",
              i <= currentIndex ? "bg-blue-500" : "bg-gray-200"
            )}
          />
        ))}
      </div>

      {/* Step content */}
      {step === "status" && <StatusStep data={data} onChange={setData} />}
      {step === "format" && <FormatStep data={data} onChange={setData} />}
      {/* ... other steps */}

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <button onClick={prevStep} disabled={currentIndex === 0}>
          Back
        </button>
        {currentIndex < steps.length - 1 ? (
          <button onClick={nextStep}>Next</button>
        ) : (
          <button onClick={() => onComplete(data as BookData)}>Complete</button>
        )}
      </div>
    </div>
  );
}
```

## Component Organization

```
src/components/
├── book/           # Book-related components
│   ├── BookCard.tsx
│   └── BookCover.tsx
├── dashboard/      # Dashboard-specific
│   ├── StatsCard.tsx
│   └── LayoutToggle.tsx
├── modals/         # Modal dialogs
│   ├── AddBookWizard.tsx
│   └── EditBookModal.tsx
├── forms/          # Reusable form fields
│   ├── BookClubField.tsx
│   └── DatePickerField.tsx
└── layout/         # Global layout
    ├── Header.tsx
    └── Sidebar.tsx
```
