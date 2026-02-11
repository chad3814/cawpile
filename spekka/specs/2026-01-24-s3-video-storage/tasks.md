# Task Breakdown: S3 Video Storage

## Overview
Total Tasks: 16

This feature integrates AWS S3 storage for rendered video files, automatically uploading videos after rendering completes and returning public S3 URLs while cleaning up local files.

## Task List

### Infrastructure Layer

#### Task Group 1: AWS S3 Client Configuration
**Dependencies:** None

- [x] 1.0 Complete S3 client infrastructure
  - [x] 1.1 Write 3-5 focused tests for S3 service module
    - Test S3Client initialization with valid environment variables
    - Test error thrown when required environment variables are missing
    - Test S3 key path generation with userId, year, month, and timestamp
    - Test public URL construction format
  - [x] 1.2 Create S3 service module (`server/lib/s3.ts`)
    - Initialize S3Client using @aws-sdk/client-s3
    - Configure with environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME
    - Export S3Client instance and bucket name constant
    - Follow existing module patterns from `server/index.ts`
  - [x] 1.3 Implement S3 key path generation function
    - Pattern: `videos/{userId}/{year}/{month}/recap-{year}-{month}-{timestamp}.mp4`
    - Use ISO 8601 timestamp format (e.g., `20260124T153042Z`)
    - Zero-pad month values to two digits
    - Export as reusable function for upload operations
  - [x] 1.4 Implement public URL generation function
    - URL format: `https://{bucket}.s3.{region}.amazonaws.com/{key}`
    - Accept bucket, region, and key as parameters
    - Export for use in API response generation
  - [x] 1.5 Ensure S3 infrastructure tests pass
    - Run ONLY the 3-5 tests written in 1.1
    - Verify S3Client initialization works with mocked credentials
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- S3Client initializes correctly with environment variables
- Key path generation produces correct format with all components
- Public URL generation produces valid S3 URLs
- All infrastructure tests pass

---

### Validation Layer

#### Task Group 2: Environment Variable Validation
**Dependencies:** Task Group 1

- [x] 2.0 Complete environment validation
  - [x] 2.1 Write 2-4 focused tests for environment validation
    - Test validation passes when all required variables are present
    - Test validation fails with descriptive error listing missing variables
    - Test fail-fast behavior at startup (not deferred to first upload)
  - [x] 2.2 Create environment validation function (`server/lib/validateEnv.ts`)
    - Validate presence of: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME
    - Throw descriptive error listing all missing variables
    - Export for server startup integration
  - [x] 2.3 Integrate validation into server startup
    - Call validation function before app.listen()
    - Ensure server fails to start if variables are missing
    - Log success message when validation passes
  - [x] 2.4 Ensure environment validation tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify fail-fast behavior works correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- Server fails to start with clear error when any AWS variable is missing
- Error message lists all missing variables (not just the first one)
- Server starts normally when all variables are present

---

### API Layer

#### Task Group 3: Request/Response Schema Updates
**Dependencies:** Task Group 1

- [x] 3.0 Complete API schema updates
  - [x] 3.1 Write 3-5 focused tests for API schema changes
    - Test userId validation rejects missing userId
    - Test userId validation rejects empty string
    - Test successful response includes s3Url field
    - Test response structure matches new format
  - [x] 3.2 Extend type definitions in `src/lib/types.ts`
    - Add `userId: string` to request type or create new render request interface
    - Define response type with s3Url field
    - Maintain backward compatibility with existing MonthlyRecapExport structure
  - [x] 3.3 Implement userId validation in render endpoint
    - Validate userId is present in request body
    - Validate userId is non-empty string
    - Return HTTP 400 with descriptive error for invalid userId
    - Follow existing validation pattern from server/index.ts:37-41
  - [x] 3.4 Update response structure
    - Add s3Url field to successful response
    - Keep filename and duration fields for compatibility
    - Remove or deprecate local path field
  - [x] 3.5 Ensure API schema tests pass
    - Run ONLY the 3-5 tests written in 3.1
    - Verify validation logic works correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- Request without userId returns 400 error
- Request with empty userId returns 400 error
- Successful response includes s3Url field
- Type definitions are properly updated

---

### Upload Layer

#### Task Group 4: S3 Upload Implementation
**Dependencies:** Task Groups 1, 2, 3

- [x] 4.0 Complete S3 upload functionality
  - [x] 4.1 Write 3-5 focused tests for S3 upload
    - Test successful upload returns public URL
    - Test upload sets correct ContentType (video/mp4)
    - Test upload failure propagates error correctly
    - Test file buffer is read correctly from disk
  - [x] 4.2 Implement upload function in S3 service module
    - Use PutObjectCommand from @aws-sdk/client-s3
    - Set ContentType to `video/mp4`
    - Read file from disk as Buffer using fs.promises.readFile
    - Configure appropriate ACL for public read access (if bucket supports)
    - Return the S3 key on success for URL generation
  - [x] 4.3 Integrate upload into render workflow
    - Execute upload immediately after renderMedia completes
    - Pass userId from validated request body
    - Use meta.year and meta.month for path construction
    - Generate and capture public URL after upload
  - [x] 4.4 Add upload logging for debugging
    - Log upload start with file size and S3 key
    - Log successful upload with public URL
    - Follow existing logging pattern: `[Render]` prefix
  - [x] 4.5 Ensure S3 upload tests pass
    - Run ONLY the 3-5 tests written in 4.1
    - Verify upload logic works correctly with mocked S3
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- Files are uploaded to S3 with correct path structure
- ContentType is set to video/mp4
- Public URL is generated correctly
- Upload operations are logged for debugging

---

### Cleanup Layer

#### Task Group 5: Local File Cleanup
**Dependencies:** Task Group 4

- [x] 5.0 Complete local file cleanup
  - [x] 5.1 Write 2-4 focused tests for file cleanup
    - Test local file is deleted after successful S3 upload
    - Test local file is NOT deleted when S3 upload fails
    - Test cleanup logs success message
  - [x] 5.2 Implement cleanup function
    - Use fs.promises.unlink for async file deletion
    - Accept file path as parameter
    - Return success/failure status for logging
  - [x] 5.3 Integrate cleanup into render workflow
    - Call cleanup ONLY after S3 upload succeeds
    - Log successful cleanup with filename
    - Follow existing fs module usage from server/index.ts
  - [x] 5.4 Ensure file cleanup tests pass
    - Run ONLY the 2-4 tests written in 5.1
    - Verify cleanup behavior is correct
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- Local file is deleted after successful S3 upload
- Local file is preserved when S3 upload fails
- Cleanup success is logged for debugging

---

### Error Handling Layer

#### Task Group 6: S3 Error Handling
**Dependencies:** Task Groups 4, 5

- [x] 6.0 Complete error handling
  - [x] 6.1 Write 2-4 focused tests for error handling
    - Test S3 error returns HTTP 500
    - Test error response includes S3 error details
    - Test local file preserved on S3 failure
    - Test error is logged with sufficient context
  - [x] 6.2 Implement S3 error handling in upload function
    - Catch S3Client errors from PutObjectCommand
    - Extract error message and code from AWS SDK error
    - Wrap in descriptive error for API response
  - [x] 6.3 Update render endpoint error handling
    - Handle S3 upload errors separately from render errors
    - Return HTTP 500 with descriptive S3 error message
    - Include S3 error code and message in response
    - Follow existing error pattern from server/index.ts:102-108
  - [x] 6.4 Add error logging with context
    - Log S3 errors with: operation, bucket, key, error message
    - Use `[S3]` prefix to distinguish from render logs
    - Include sufficient context for debugging
  - [x] 6.5 Ensure error handling tests pass
    - Run ONLY the 2-4 tests written in 6.1
    - Verify error propagation works correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- S3 upload failures return HTTP 500
- Error response includes descriptive S3 error details
- Errors are logged with sufficient debugging context
- Request fails entirely on S3 error (no partial success)

---

### Testing

#### Task Group 7: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-6

- [x] 7.0 Review existing tests and fill critical gaps only
  - [x] 7.1 Review tests from Task Groups 1-6
    - Review the 3-5 tests from infrastructure (Task 1.1)
    - Review the 2-4 tests from validation (Task 2.1)
    - Review the 3-5 tests from API schema (Task 3.1)
    - Review the 3-5 tests from upload (Task 4.1)
    - Review the 2-4 tests from cleanup (Task 5.1)
    - Review the 2-4 tests from error handling (Task 6.1)
    - Total existing tests: approximately 15-27 tests
  - [x] 7.2 Analyze test coverage gaps for THIS feature only
    - Identify critical end-to-end workflow gaps
    - Focus ONLY on S3 integration feature requirements
    - Prioritize integration tests over additional unit tests
    - Do NOT assess entire application test coverage
  - [x] 7.3 Write up to 5 additional integration tests maximum
    - Test complete render-to-S3-upload workflow (happy path)
    - Test complete workflow with S3 failure (verify local file preserved)
    - Test environment validation at server startup
    - Do NOT write comprehensive coverage for all scenarios
    - Skip edge cases unless business-critical
  - [x] 7.4 Run feature-specific tests only
    - Run ONLY tests related to S3 video storage feature
    - Expected total: approximately 20-32 tests maximum
    - Verify critical workflows pass
    - Do NOT run the entire application test suite

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 20-32 tests total)
- Critical S3 integration workflows are covered
- No more than 5 additional tests added when filling in gaps
- Testing focused exclusively on S3 video storage feature

## Execution Order

Recommended implementation sequence:
1. **Infrastructure Layer** (Task Group 1) - S3 client and utilities
2. **Validation Layer** (Task Group 2) - Environment variable validation
3. **API Layer** (Task Group 3) - Request/response schema updates
4. **Upload Layer** (Task Group 4) - S3 upload implementation
5. **Cleanup Layer** (Task Group 5) - Local file cleanup
6. **Error Handling Layer** (Task Group 6) - S3 error handling
7. **Testing** (Task Group 7) - Test review and gap analysis

## Key Dependencies

```
Task Group 1 (S3 Client)
    |
    +---> Task Group 2 (Env Validation)
    |
    +---> Task Group 3 (API Schema)
              |
              v
         Task Group 4 (S3 Upload)
              |
              v
         Task Group 5 (File Cleanup)
              |
              v
         Task Group 6 (Error Handling)
              |
              v
         Task Group 7 (Test Review)
```

## Files to Create/Modify

**New Files:**
- `server/lib/s3.ts` - S3 client and upload functions
- `server/lib/validateEnv.ts` - Environment variable validation

**Modified Files:**
- `server/index.ts` - Integrate S3 upload, cleanup, and validation
- `src/lib/types.ts` - Add userId to request type, update response type

**Test Files:**
- `server/__tests__/s3.test.ts` - S3 service unit tests
- `server/__tests__/validateEnv.test.ts` - Environment validation tests
- `server/__tests__/render.test.ts` - API endpoint tests (may be new or extended)
