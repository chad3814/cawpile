---
name: Accessibility (a11y)
description: Standards for web accessibility with Headless UI and React. Use when creating interactive components, modals, forms, or any user-facing UI in src/components/.
---

# Accessibility (a11y)

## When to use this skill:
- Creating modals, dialogs, or overlays
- Building form inputs and controls
- Implementing keyboard navigation
- Adding ARIA attributes to custom components
- Working with Headless UI components

## Headless UI Components

Use Headless UI for accessible primitives - they handle ARIA, focus management, and keyboard navigation automatically.

```tsx
// Modal/Dialog - fully accessible out of the box
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";

export function Modal({ isOpen, onClose, title, children }) {
  return (
    <Transition show={isOpen}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="bg-white rounded-lg p-6 max-w-md w-full">
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              {children}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
```

## Form Accessibility

```tsx
// Always associate labels with inputs
<div>
  <label htmlFor="book-title" className="block text-sm font-medium">
    Book Title
  </label>
  <input
    id="book-title"
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    aria-describedby="title-hint"
    aria-invalid={!!error}
    className="mt-1 block w-full rounded-md border-gray-300"
  />
  <p id="title-hint" className="mt-1 text-sm text-gray-500">
    Enter the full title as it appears on the cover
  </p>
  {error && (
    <p role="alert" className="mt-1 text-sm text-red-600">
      {error}
    </p>
  )}
</div>
```

## Button Accessibility

```tsx
// Icon-only buttons need accessible labels
<button
  onClick={handleDelete}
  aria-label="Delete book"
  className="p-2 rounded hover:bg-gray-100"
>
  <TrashIcon className="h-5 w-5" aria-hidden="true" />
</button>

// Loading states
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? "Saving..." : "Save"}
</button>
```

## Keyboard Navigation

```tsx
// Handle keyboard events for custom components
function handleKeyDown(e: React.KeyboardEvent) {
  switch (e.key) {
    case "Enter":
    case " ":
      e.preventDefault();
      handleSelect();
      break;
    case "Escape":
      handleClose();
      break;
    case "ArrowDown":
      e.preventDefault();
      focusNextItem();
      break;
    case "ArrowUp":
      e.preventDefault();
      focusPreviousItem();
      break;
  }
}

<div
  role="listbox"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  aria-activedescendant={activeId}
>
  {items.map((item) => (
    <div
      key={item.id}
      id={item.id}
      role="option"
      aria-selected={item.id === selectedId}
    >
      {item.label}
    </div>
  ))}
</div>
```

## Focus Management

```tsx
import { useRef, useEffect } from "react";

function SearchModal({ isOpen }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus input when modal opens
      inputRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <input
      ref={inputRef}
      type="search"
      placeholder="Search books..."
    />
  );
}
```

## Screen Reader Announcements

```tsx
// Announce dynamic content changes
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// sr-only class (Tailwind)
// .sr-only { position: absolute; width: 1px; height: 1px; ... }
```

## Quick Reference

| Element | Required Attributes |
|---------|-------------------|
| Button without text | `aria-label` |
| Form input | `id` + `<label htmlFor>` |
| Error message | `role="alert"` |
| Loading state | `aria-busy="true"` |
| Icon | `aria-hidden="true"` |
| Custom toggle | `role="switch"`, `aria-checked` |
| Custom listbox | `role="listbox"`, `role="option"`, `aria-selected` |
