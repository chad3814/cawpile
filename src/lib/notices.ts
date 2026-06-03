import 'server-only';
import type { Notice } from '@/lib/notices-types';
import UsernameNotice from '@/components/notices/UsernameNotice';
import SettingsNotice from '@/components/notices/SettingsNotice';
import BooksDiscoveryNotice from '@/components/notices/BooksDiscoveryNotice';

export type { Notice, NoticeComponentProps } from '@/lib/notices-types';

// Registry of all feature notices. Add new notices here.
// Each notice needs a corresponding entry in src/lib/notice-components.ts.
export const NOTICES: Notice[] = [
  {
    id: 'set-username-2026-04',
    title: 'Set Your Username',
    component: UsernameNotice,
    target: async (user) => !user.username,
  },
  {
    id: 'settings-profile-2026-04',
    title: 'Customize Your Profile',
    component: SettingsNotice,
    target: async () => true,
  },
  {
    id: 'books-discovery-2026-06',
    title: 'Discover Books',
    component: BooksDiscoveryNotice,
    target: async () => true,
  },
];
