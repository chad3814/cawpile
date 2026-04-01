# Feature Notices

Feature notices are modal alerts shown to users on page load when a new feature has been added or when they need to configure a new setting. Each notice is shown once per user and dismissed state is persisted in the database.

## How It Works

1. On page load, `FeatureNoticeContainer` fetches `GET /api/user/notices`
2. The API evaluates each notice's `target` function against the current user and filters out already-seen notices
3. Applicable unseen notices are returned and shown one at a time
4. When the user dismisses a notice, `POST /api/user/notices/seen` records it in the `SeenNotice` table
5. The next notice in the queue (if any) is shown immediately after

## Adding a Notice

### Step 1 — Create the notice component

Create a file in `src/components/notices/`. The component receives `onDismiss` and is responsible for its own content and any action buttons.

```tsx
// src/components/notices/MyFeatureNotice.tsx
'use client'

import type { NoticeComponentProps } from '@/lib/notices-types';
import Link from 'next/link';

export default function MyFeatureNotice({ onDismiss }: NoticeComponentProps) {
  return (
    <div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        We added a new feature. Here's what you can do with it.
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onDismiss}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Got it
        </button>
        <Link
          href="/settings"
          onClick={onDismiss}
          className="rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  );
}
```

Calling `onDismiss` marks the notice as seen and removes it from the queue. Call it on any action that should close the modal (including navigation links, so the modal doesn't linger after a route change).

### Step 2 — Register the component

Add an entry to `NOTICE_COMPONENTS` in `src/lib/notice-components.ts`:

```ts
import MyFeatureNotice from '@/components/notices/MyFeatureNotice';

export const NOTICE_COMPONENTS: Record<string, ComponentType<NoticeComponentProps>> = {
  'my-feature-2026-04': MyFeatureNotice,
};
```

### Step 3 — Add the notice definition

Add a `Notice` object to `NOTICES` in `src/lib/notices.ts`:

```ts
import MyFeatureNotice from '@/components/notices/MyFeatureNotice';

export const NOTICES: Notice[] = [
  {
    id: 'my-feature-2026-04',
    title: 'New: My Feature',
    component: MyFeatureNotice,
    target: async (user) => {
      // Show to all users:
      return true;

      // Or target by user state — the full Prisma User row is available.
      // Additional DB queries are allowed since target is async:
      // const count = await prisma.userBook.count({ where: { userId: user.id } });
      // return count > 0;
    },
  },
];
```

## Choosing a Notice ID

Notice IDs are permanent — once a user has seen a notice, the `SeenNotice` row stores the ID forever. Follow the convention `kebab-description-YYYY-MM` (e.g. `video-template-select-2026-04`). Never reuse or rename an existing ID.

## Targeting

The `target` function receives the full Prisma `User` row and must return a `Promise<boolean>`. It runs server-side only (in the API route). Use it to limit notices to users who are actually affected:

| Goal | Example |
|---|---|
| All users | `async () => true` |
| Users without a username | `async (user) => !user.username` |
| Users who haven't selected a template | `async (user) => !user.selectedTemplateId` |
| Users with no books logged | `async (user) => { const n = await prisma.userBook.count(...); return n === 0; }` |

## Relevant Files

| File | Purpose |
|---|---|
| `src/lib/notices-types.ts` | `Notice` and `NoticeComponentProps` types |
| `src/lib/notices.ts` | Server-only notice registry (targeting logic lives here) |
| `src/lib/notice-components.ts` | Client-safe map of notice ID → component |
| `src/components/notices/` | Individual notice content components |
| `src/components/modals/FeatureNoticeModal.tsx` | Modal wrapper (title + X button) |
| `src/components/FeatureNoticeContainer.tsx` | Fetches queue, renders one notice at a time |
| `src/app/api/user/notices/route.ts` | `GET` — returns unseen applicable notices |
| `src/app/api/user/notices/seen/route.ts` | `POST` — marks a notice as seen |
