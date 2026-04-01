'use client'

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import FeatureNoticeModal from '@/components/modals/FeatureNoticeModal';
import { NOTICE_COMPONENTS } from '@/lib/notice-components';

type PendingNotice = { id: string; title: string };

export default function FeatureNoticeContainer() {
  const { data: session } = useSession();
  const [queue, setQueue] = useState<PendingNotice[]>([]);

  useEffect(() => {
    if (!session?.user) return;

    fetch('/api/user/notices')
      .then((r) => r.json())
      .then((notices: PendingNotice[]) => setQueue(notices))
      .catch(() => {});
  }, [session?.user]);

  const current = queue[0];
  const NoticeComponent = current ? NOTICE_COMPONENTS[current.id] : undefined;

  if (!current || !NoticeComponent) return null;

  const handleDismiss = () => {
    fetch('/api/user/notices/seen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticeId: current.id }),
    }).catch(() => {});
    setQueue((prev) => prev.slice(1));
  };

  return (
    <FeatureNoticeModal
      isOpen={true}
      title={current.title}
      component={NoticeComponent}
      onDismiss={handleDismiss}
    />
  );
}
