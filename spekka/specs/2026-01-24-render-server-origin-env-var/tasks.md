# Task Breakdown: Render Server Origin Environment Variable

## Overview
Total Tasks: 10

This is a focused frontend configuration change that requires:
1. Environment variable setup with documentation
2. Component updates to use configurable URL and add userId
3. Response handling changes for S3-based downloads
4. Testing to verify the integration works correctly

## Task List

### Configuration Layer

#### Task Group 1: Environment Variable Setup
**Dependencies:** None

- [x] 1.0 Complete environment variable configuration
  - [x] 1.1 Write 2-4 focused tests for environment variable usage
    - Test that `NEXT_PUBLIC_RENDER_SERVER_URL` is read correctly when set
    - Test fallback to `http://localhost:3001` when env var is not set
    - Test URL construction with environment variable value
  - [x] 1.2 Update `.env.example` with render server configuration
    - Add new section "# Render Server Configuration" after "External APIs" section
    - Add `NEXT_PUBLIC_RENDER_SERVER_URL` entry with example value `https://render.cawpile.org`
    - Include comment explaining purpose and default fallback value
    - File: `/Users/cwalker/Projects/cawpile/main/.env.example`
  - [x] 1.3 Ensure configuration tests pass
    - Run ONLY the tests written in 1.1
    - Verify environment variable is properly documented

**Acceptance Criteria:**
- `.env.example` contains documented `NEXT_PUBLIC_RENDER_SERVER_URL` entry
- Tests verify environment variable reading and fallback behavior
- Configuration follows existing `.env.example` patterns

### Frontend Component Layer

#### Task Group 2: MonthlyRecapModal SSE URL Updates
**Dependencies:** Task Group 1

- [x] 2.0 Complete SSE URL configuration updates
  - [x] 2.1 Write 2-4 focused tests for SSE URL construction
    - Test that render server URL uses environment variable when set
    - Test that render server URL falls back to `http://localhost:3001` when not set
    - Test that userId is included as query parameter in SSE URL
    - Test URL encoding of data parameter remains correct
  - [x] 2.2 Add render server URL helper constant
    - Create constant at component level or in a utility
    - Read from `process.env.NEXT_PUBLIC_RENDER_SERVER_URL`
    - Provide fallback: `process.env.NEXT_PUBLIC_RENDER_SERVER_URL || 'http://localhost:3001'`
  - [x] 2.3 Update `handleGenerateVideo` function to use configurable URL
    - Replace hardcoded `http://localhost:3001` with render server URL constant
    - Modify SSE URL at line 152 in `/Users/cwalker/Projects/cawpile/main/src/components/modals/MonthlyRecapModal.tsx`
    - Pattern: `` `${RENDER_SERVER_URL}/render-stream?data=${encodedData}` ``
  - [x] 2.4 Add userId to SSE URL query parameters
    - Import `useSession` from `next-auth/react` to access current user
    - Extract userId from session: `session?.user?.id`
    - Add userId to URL: `` `${RENDER_SERVER_URL}/render-stream?data=${encodedData}&userId=${userId}` ``
    - Handle case where userId might be undefined (use empty string or skip parameter)
  - [x] 2.5 Ensure SSE URL construction tests pass
    - Run ONLY the tests written in 2.1
    - Verify URL is correctly constructed with all parameters

**Acceptance Criteria:**
- SSE URL uses `NEXT_PUBLIC_RENDER_SERVER_URL` environment variable
- Falls back to `http://localhost:3001` when env var not set
- userId is included as query parameter
- Existing data encoding continues to work

#### Task Group 3: S3 Video Download Implementation
**Dependencies:** Task Group 2

- [x] 3.0 Complete S3-based video download
  - [x] 3.1 Write 2-4 focused tests for complete event handling
    - Test that `s3Url` is extracted from complete event data
    - Test that download uses S3 URL instead of `/download/` endpoint
    - Test that download link is correctly created with S3 URL
  - [x] 3.2 Update complete event handler response type
    - Modify type from `{ filename: string }` to `{ filename: string; s3Url: string }`
    - Update at line 166 in `/Users/cwalker/Projects/cawpile/main/src/components/modals/MonthlyRecapModal.tsx`
  - [x] 3.3 Update video download to use S3 URL
    - Remove construction of `/download/${filename}` URL (line 169)
    - Use `eventData.s3Url` directly for download
    - Keep filename extraction for download attribute: `a.download = eventData.filename`
    - Updated download link: `a.href = eventData.s3Url`
  - [x] 3.4 Ensure S3 download tests pass
    - Run ONLY the tests written in 3.1
    - Verify complete event handler works with new response format

**Acceptance Criteria:**
- Complete event extracts `s3Url` from response
- Video downloads directly from S3 URL
- No dependency on render server `/download/` endpoint
- Filename is preserved for the download attribute

### Testing

#### Task Group 4: Integration Test Review
**Dependencies:** Task Groups 1-3

- [x] 4.0 Review and validate implementation
  - [x] 4.1 Review tests from Task Groups 1-3
    - Review the 2-4 tests written for env var configuration (Task 1.1)
    - Review the 2-4 tests written for SSE URL construction (Task 2.1)
    - Review the 2-4 tests written for S3 download handling (Task 3.1)
    - Total existing tests: approximately 6-12 tests
  - [x] 4.2 Analyze test coverage gaps for this feature
    - Verify end-to-end flow: env var -> URL construction -> SSE connection -> S3 download
    - Check that session handling is tested (userId availability)
    - Identify any critical integration paths not covered
  - [x] 4.3 Write up to 4 additional strategic tests if needed
    - Integration test for full video generation flow with mocked SSE
    - Test for graceful handling when userId is not available
    - Add tests only for critical gaps identified
  - [x] 4.4 Run feature-specific tests
    - Run ONLY tests related to MonthlyRecapModal and render configuration
    - Expected total: approximately 10-16 tests maximum
    - Verify all feature tests pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 10-16 tests total)
- Environment variable configuration works correctly
- SSE URL includes userId parameter
- S3 download flow works with new response format

## Execution Order

Recommended implementation sequence:
1. Configuration Layer (Task Group 1) - Set up environment variable and documentation
2. SSE URL Updates (Task Group 2) - Update URL construction with env var and userId
3. S3 Download Implementation (Task Group 3) - Update complete event handler for S3
4. Integration Test Review (Task Group 4) - Validate complete implementation

## Files to Modify

| File | Changes |
|------|---------|
| `/Users/cwalker/Projects/cawpile/main/.env.example` | Add `NEXT_PUBLIC_RENDER_SERVER_URL` documentation |
| `/Users/cwalker/Projects/cawpile/main/src/components/modals/MonthlyRecapModal.tsx` | Update SSE URL, add userId, change download to S3 |

## Key Implementation Notes

1. **Session Access**: The component needs `useSession` from `next-auth/react` to get `session.user.id`
2. **URL Construction**: Build SSE URL as: `${NEXT_PUBLIC_RENDER_SERVER_URL}/render-stream?data=${encodedData}&userId=${userId}`
3. **Response Format Change**: Complete event now returns `{ filename: string; s3Url: string }` instead of just filename
4. **Fallback Behavior**: Always fallback to `http://localhost:3001` for local development when env var not set
