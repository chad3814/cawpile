import type { ComponentType } from 'react';
import type { User } from '@prisma/client';

export type NoticeComponentProps = {
  onDismiss: () => void;
};

export type Notice = {
  id: string;
  title: string;
  component: ComponentType<NoticeComponentProps>;
  target: (user: User) => Promise<boolean>;
};
