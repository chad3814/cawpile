import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getCurrentUser } from '@/lib/auth/admin';
import { prisma } from '@/lib/prisma';
import { s3Client, AWS_S3_BUCKET, getS3PublicUrl } from '@/lib/s3';
import { MAX_FILE_SIZE, getExtensionFromContentType } from '@/lib/s3-upload';
import type { ValidImageType } from '@/lib/s3-upload';

const VALID_COVER_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

type ValidCoverType = typeof VALID_COVER_TYPES[number];

const PRESIGNED_URL_EXPIRATION = 60 * 5;

function isValidCoverType(contentType: string): contentType is ValidCoverType {
  return VALID_COVER_TYPES.includes(contentType as ValidCoverType);
}

/**
 * POST /api/admin/editions/[id]/covers/presigned-url
 * Generates a presigned URL for uploading a custom cover image to S3.
 *
 * Request body: { contentType: string, fileSize: number }
 * Response: { presignedUrl: string, key: string, publicUrl: string }
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
    const { contentType, fileSize } = body;

    const edition = await prisma.edition.findUnique({ where: { id } });
    if (!edition) {
      return NextResponse.json({ error: 'Edition not found' }, { status: 404 });
    }

    if (!contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      );
    }

    if (!isValidCoverType(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type. Allowed types: ${VALID_COVER_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (fileSize === undefined || fileSize === null) {
      return NextResponse.json(
        { error: 'File size is required' },
        { status: 400 }
      );
    }

    if (typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json(
        { error: 'Invalid file size' },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const ext = getExtensionFromContentType(contentType as ValidImageType);
    const key = `covers/${id}/${timestamp}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRATION,
    });

    const publicUrl = getS3PublicUrl(key);

    return NextResponse.json({ presignedUrl, key, publicUrl });
  } catch (error) {
    console.error('Error generating presigned URL for cover upload:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
