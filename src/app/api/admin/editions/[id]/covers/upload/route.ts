import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { s3Client, AWS_S3_BUCKET, getS3PublicUrl } from '@/lib/s3';
import { deleteAvatar, extractKeyFromUrl } from '@/lib/s3-upload';
import { logAdminAction } from '@/lib/audit/logger';

const COVER_MAX_WIDTH = 600;
const COVER_MAX_HEIGHT = 900;

/**
 * POST /api/admin/editions/[id]/covers/upload
 * Completes the cover upload by resizing and re-uploading, then saving to the edition.
 *
 * Request body: { key: string }
 * Response: { coverUrl: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { key } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'S3 key is required' }, { status: 400 });
    }

    if (!key.startsWith(`covers/${id}/`)) {
      return NextResponse.json({ error: 'Invalid S3 key' }, { status: 403 });
    }

    const edition = await prisma.edition.findUnique({ where: { id } });
    if (!edition) {
      return NextResponse.json({ error: 'Edition not found' }, { status: 404 });
    }

    // Download the original image from S3
    const getCommand = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(getCommand);

    if (!response.Body) {
      throw new Error('Failed to download image from S3');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const s3Body = response.Body;

    if ('getReader' in s3Body) {
      const reader = (s3Body as ReadableStream).getReader();
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          chunks.push(result.value);
        }
      }
    } else if (Symbol.asyncIterator in s3Body) {
      for await (const chunk of s3Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
    } else {
      throw new Error('Unexpected body type from S3');
    }

    const originalBuffer = Buffer.concat(chunks);

    // Resize to fit within cover dimensions, preserving aspect ratio
    const resizedBuffer = await sharp(originalBuffer)
      .resize(COVER_MAX_WIDTH, COVER_MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    const resizedKey = key.replace(/\.[^.]+$/, '-resized.jpg');

    const putCommand = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: resizedKey,
      Body: resizedBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=31536000',
    });

    await s3Client.send(putCommand);

    // Delete the original upload
    deleteAvatar(key).catch((err) => {
      console.error('Failed to delete original cover upload:', err);
    });

    const coverUrl = getS3PublicUrl(resizedKey);

    // Delete old custom cover from S3 if one existed
    if (edition.customCoverUrl) {
      const oldKey = extractKeyFromUrl(edition.customCoverUrl);
      if (oldKey) {
        deleteAvatar(oldKey).catch((err) => {
          console.error('Failed to delete old custom cover:', err);
        });
      }
    }

    const oldValue = edition.customCoverUrl;

    await prisma.edition.update({
      where: { id },
      data: { customCoverUrl: coverUrl },
    });

    await logAdminAction(user.id, {
      entityType: 'Edition',
      entityId: id,
      fieldName: 'customCoverUrl',
      actionType: 'UPDATE',
      oldValue: oldValue,
      newValue: coverUrl,
    });

    return NextResponse.json({ coverUrl });
  } catch (error) {
    console.error('Error processing cover upload:', error);
    return NextResponse.json(
      { error: 'Failed to process cover image' },
      { status: 500 }
    );
  }
}
