import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { NOTICES } from '@/lib/notices';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { noticeId } = body;

  if (typeof noticeId !== 'string' || !noticeId) {
    return NextResponse.json({ error: 'Invalid noticeId' }, { status: 400 });
  }

  if (!NOTICES.some((n) => n.id === noticeId)) {
    return NextResponse.json({ error: 'Unknown notice' }, { status: 400 });
  }

  await prisma.seenNotice.upsert({
    where: { userId_noticeId: { userId: user.id, noticeId } },
    create: { userId: user.id, noticeId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
