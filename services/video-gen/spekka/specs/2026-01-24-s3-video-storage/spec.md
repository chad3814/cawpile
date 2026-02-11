# Specification: S3 Video Storage

## Goal

Integrate AWS S3 storage for rendered video files, automatically uploading videos after rendering completes and returning public S3 URLs while cleaning up local files.

## User Stories

- As a video consumer, I want rendered videos uploaded to S3 so that I can access them via a persistent public URL
- As a system operator, I want local files deleted after S3 upload so that server storage does not accumulate rendered videos

## Specific Requirements

**AWS S3 Client Configuration**
- Create an S3 service module using the AWS SDK for JavaScript v3 (@aws-sdk/client-s3)
- Initialize S3Client with credentials from environment variables at module load
- Required environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME
- Throw descriptive errors if any required environment variable is missing at startup

**Environment Variable Validation**
- Validate all four required AWS environment variables are present when the server starts
- Fail fast with clear error message listing which variables are missing
- Do not defer validation to first upload attempt

**S3 Path Structure**
- Generate S3 object keys following pattern: `videos/{userId}/{year}/{month}/recap-{year}-{month}-{timestamp}.mp4`
- Use ISO 8601 timestamp format for uniqueness and sortability (e.g., `20260124T153042Z`)
- Zero-pad month values to two digits (e.g., `01`, `12`)
- The userId must be provided in the render request body

**Upload Implementation**
- Use PutObjectCommand with ContentType set to `video/mp4`
- Read the rendered file from disk and upload as a Buffer
- Execute upload immediately after renderMedia completes successfully
- Set appropriate ACL for public read access OR generate a public URL based on bucket configuration

**Public URL Generation**
- Construct the public S3 URL after successful upload
- URL format: `https://{bucket}.s3.{region}.amazonaws.com/{key}`
- Return this URL in the API response under a new `s3Url` field

**Local File Cleanup**
- Delete the local file from OUTPUT_DIR only after S3 upload succeeds
- Use fs.promises.unlink for async deletion
- Log successful cleanup for debugging purposes

**Error Handling**
- If S3 upload fails, do not delete local file
- Return HTTP 500 with descriptive error message including S3 error details
- Propagate the entire request failure to the client (no partial success)
- Log S3 errors with sufficient context for debugging

**API Request/Response Changes**
- Add required `userId` field to the render request body
- Validate userId is present and non-empty string
- Add `s3Url` field to successful response containing the public URL
- Remove or deprecate the local `path` field in favor of S3 URL

## Visual Design

No visual assets provided.

## Existing Code to Leverage

**server/index.ts - Render Endpoint**
- Existing POST /render endpoint handles video rendering workflow
- File naming pattern already generates timestamp-based filenames on line 73
- Error handling pattern with try/catch and structured JSON responses can be extended
- OUTPUT_DIR constant and fs module already imported for file operations

**server/index.ts - Express Configuration**
- Express app with JSON parsing and CORS already configured
- PORT from environment variable pattern demonstrates env var usage
- Health check endpoint pattern for operational endpoints

**src/lib/types.ts - MonthlyRecapExport Interface**
- Contains meta.month, meta.year fields needed for S3 path construction
- Type definitions can be extended for request validation
- Existing structure should inform userId addition location

## Out of Scope

- S3 object deletion or lifecycle management APIs
- S3 lifecycle policy configuration or automation
- CloudFront CDN integration or distribution setup
- Webhook notifications for upload completion
- IAM role-based authentication (only env var credentials)
- Retry mechanisms or exponential backoff for failed uploads
- Fallback to local storage when S3 upload fails
- Pre-signed URL generation for private buckets
- Multipart upload for large files
- Upload progress tracking or streaming
