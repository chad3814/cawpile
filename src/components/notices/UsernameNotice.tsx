'use client'

import { useState, useEffect } from 'react';
import { CheckIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useUsernameCheck } from '@/hooks/useUsernameCheck';
import type { NoticeComponentProps } from '@/lib/notices-types';

export default function UsernameNotice({ onDismiss }: NoticeComponentProps) {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { isChecking, isAvailable, message, error } = useUsernameCheck(username, null, 300);

  useEffect(() => {
    setUsername('');
    setIsSubmitting(false);
    setSubmitError(null);
  }, []);

  const canSave = username.trim().length > 0 && isAvailable === true && !isChecking && !isSubmitting;

  const handleSave = async () => {
    if (!canSave) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save username');
      }

      onDismiss();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Set a username to enable your public profile and let others find you.
      </p>

      <div className="mb-6">
        <label
          htmlFor="notice-username"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Username
        </label>
        <div className="relative">
          <input
            type="text"
            id="notice-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
            placeholder="Enter your username"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
            autoComplete="off"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {isChecking && (
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {!isChecking && isAvailable === true && username.trim() && (
              <CheckIcon className="h-5 w-5 text-green-500" />
            )}
            {!isChecking && isAvailable === false && username.trim() && (
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>
        {message && username.trim() && (
          <p className={`mt-2 text-sm ${isAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {message}
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {submitError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{submitError}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onDismiss}
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Username'}
        </button>
      </div>
    </div>
  );
}
