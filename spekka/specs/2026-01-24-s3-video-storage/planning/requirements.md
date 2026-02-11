# Spec Requirements: S3 Video Storage

## Initial Description

Implement S3 storage integration for rendered video files, allowing videos to be automatically uploaded to AWS S3 after rendering completes, with local file cleanup and public URL generation.

## Requirements Discussion

### First Round Questions

**Q1:** When should the S3 upload occur - immediately after rendering completes, or on-demand when requested?
**Answer:** Upload immediately after rendering completes

**Q2:** What authentication method should be used for AWS S3 - environment variable credentials or IAM role support?
**Answer:** Just environment variable credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME) - no IAM role support needed

**Q3:** Should local files be deleted after successful S3 upload, or retained for a period?
**Answer:** Delete local files after successful S3 upload

**Q4:** What S3 path structure should be used for organizing uploaded videos?
**Answer:** Include userId in the S3 path structure (e.g., `videos/{userId}/{year}/{month}/recap-{year}-{month}-{timestamp}.mp4`)

**Q5:** Should the API response include the S3 URL, or should there be a separate endpoint to retrieve it?
**Answer:** Return public S3 URL in the response

**Q6:** How should S3 upload failures be handled - retry, fallback to local, or fail the request?
**Answer:** Return an error if S3 upload fails (fail the whole request)

**Q7:** Are there any features that should be explicitly excluded from this implementation?
**Answer:** Only the features above are in scope - no deletion, lifecycle policies, CloudFront, or webhooks

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

None required - all requirements are clearly defined.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements
- Automatic S3 upload triggered immediately after video rendering completes
- AWS authentication via environment variables:
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - AWS_REGION
  - S3_BUCKET_NAME
- S3 path structure: `videos/{userId}/{year}/{month}/recap-{year}-{month}-{timestamp}.mp4`
- Local file deletion after successful S3 upload
- Public S3 URL returned in API response
- Request fails entirely if S3 upload fails (no retry or fallback)

### Reusability Opportunities
- None identified - this is new functionality

### Scope Boundaries

**In Scope:**
- S3 upload integration with environment variable authentication
- Automatic upload after rendering completes
- User-organized path structure with userId, year, and month
- Local file cleanup after successful upload
- Public URL generation and response
- Error handling that fails the entire request on upload failure

**Out of Scope:**
- S3 object deletion functionality
- S3 lifecycle policies configuration
- CloudFront CDN integration
- Webhook notifications
- IAM role-based authentication
- Retry mechanisms for failed uploads
- Fallback to local storage on failure

### Technical Considerations
- Must use AWS SDK for JavaScript/TypeScript
- Environment variables must be validated at startup
- S3 bucket must be configured for public read access (or pre-signed URLs)
- Timestamp format should be consistent and sortable (ISO 8601 recommended)
- Error messages should be informative for debugging S3 issues
