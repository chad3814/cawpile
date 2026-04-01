import 'server-only';
import type { Notice } from '@/lib/notices-types';

export type { Notice, NoticeComponentProps } from '@/lib/notices-types';

// Registry of all feature notices. Add new notices here.
// Each notice needs a corresponding entry in src/lib/notice-components.ts.
export const NOTICES: Notice[] = [];
