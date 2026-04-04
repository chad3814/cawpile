'use client'

import Image from 'next/image';
import Link from 'next/link';
import type { NoticeComponentProps } from '@/lib/notices-types';

export default function SettingsNotice({ onDismiss }: NoticeComponentProps) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Did you know you can customize your experience? Head to{' '}
        <strong>Settings &amp; Preferences</strong> to set up your public profile
        page, or update your avatar.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Enabling your public profile lets other readers discover you and see your
        reviews and reading activity.
      </p>
      <Image
        src="/images/settings-notice.webp"
        alt="Animation showing how to navigate to Settings and enable your public profile"
        width={512}
        height={584}
        className="rounded-lg border border-gray-200 dark:border-gray-700 mb-6"
        unoptimized
      />
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          Got it
        </button>
        <Link
          href="/settings"
          onClick={onDismiss}
          className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  );
}
