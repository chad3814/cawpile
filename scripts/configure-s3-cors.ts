/**
 * Configures the CORS policy on the S3 bucket used for avatar and template
 * background uploads. Must be run once per bucket (re-running is idempotent).
 *
 * Usage: npx tsx scripts/configure-s3-cors.ts
 */

import { PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { s3Client, AWS_S3_BUCKET } from '../src/lib/s3';

const corsConfig = {
  CORSRules: [
    {
      // Required for presigned URL PUT uploads from the browser
      AllowedMethods: ['PUT'],
      // Allow any origin — the presigned URL is already scoped and time-limited,
      // so there is no meaningful security gain from restricting the origin here.
      AllowedOrigins: ['*'],
      AllowedHeaders: ['*'],
      MaxAgeSeconds: 3000,
      MaxAgeSeconds: 3600,
  ],
};

async function configureCors() {
  console.log(`Configuring CORS on bucket: ${AWS_S3_BUCKET}`);

  await s3Client.send(
    new PutBucketCorsCommand({
      Bucket: AWS_S3_BUCKET,
      CORSConfiguration: corsConfig,
    })
  );

  console.log('CORS configuration applied successfully.');
}

configureCors().catch((err) => {
  console.error('Failed to configure CORS:', err);
  process.exit(1);
});
