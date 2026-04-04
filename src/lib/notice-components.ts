import type { ComponentType } from 'react';
import type { NoticeComponentProps } from '@/lib/notices-types';
import UsernameNotice from '@/components/notices/UsernameNotice';
import SettingsNotice from '@/components/notices/SettingsNotice';

// Client-safe registry mapping notice IDs to their React components.
// Add an entry here whenever a new notice is added to src/lib/notices.ts.
export const NOTICE_COMPONENTS: Record<string, ComponentType<NoticeComponentProps>> = {
  'set-username-2026-04': UsernameNotice,
  'settings-profile-2026-04': SettingsNotice,
};
