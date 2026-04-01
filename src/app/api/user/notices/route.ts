import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { NOTICES } from '@/lib/notices';

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const seenRows = await prisma.seenNotice.findMany({
    where: { userId: user.id },
    select: { noticeId: true },
  });
  const seenIds = new Set(seenRows.map((r) => r.noticeId));

  const unseen = NOTICES.filter((n) => !seenIds.has(n.id));

  const results = await Promise.all(
    unseen.map(async (notice) => ({
      id: notice.id,
      title: notice.title,
      applicable: await notice.target(dbUser),
    }))
  );

  const applicable = results
    .filter((r) => r.applicable)
    .map((r) => ({ id: r.id, title: r.title }));

  return NextResponse.json(applicable);
}
