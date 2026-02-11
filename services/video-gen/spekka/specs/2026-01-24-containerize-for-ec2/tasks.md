# Task Breakdown: Containerize for EC2

## Overview
Total Tasks: 12

This feature involves creating Docker infrastructure to containerize the Remotion video generation application for deployment on an existing EC2 instance. The implementation focuses on three core deliverables: Dockerfile, entrypoint script, and docker-compose integration.

## Task List

### Infrastructure Layer

#### Task Group 1: Dockerfile Creation
**Dependencies:** None

- [x] 1.0 Complete Dockerfile implementation
  - [x] 1.1 Create Dockerfile with base image and system dependencies
    - Base image: `node:22-bookworm-slim`
    - Install Chrome Headless Shell dependencies via apt-get:
      - libnss3, libdbus-1-3, libatk1.0-0, libgbm-dev, libasound2
      - libxrandr2, libxkbcommon-dev, libxfixes3, libxcomposite1, libxdamage1
      - libatk-bridge2.0-0, libpango-1.0-0, libcairo2, libcups2
    - Clean apt cache after installation
  - [x] 1.2 Configure layer caching for npm dependencies
    - Copy package.json and package-lock.json first
    - Run npm ci --omit=dev for production dependencies
    - Copy remaining source files after npm install
  - [x] 1.3 Copy application source files
    - Copy: src/, server/, remotion.config.ts, tsconfig.json
    - Create /app/out directory with appropriate permissions
  - [x] 1.4 Install Chrome Headless Shell
    - Run `npx remotion browser ensure` to install Chrome
    - This must occur after npm install
  - [x] 1.5 Configure runtime environment
    - Set NODE_ENV=production
    - Expose port 3001
    - Set WORKDIR to /app
  - [x] 1.6 Add Docker HEALTHCHECK instruction
    - Use curl or wget to check /health endpoint
    - Interval: 30s, Timeout: 10s, Retries: 3, Start-period: 40s
    - Endpoint: http://localhost:3001/health

**Acceptance Criteria:**
- Dockerfile builds successfully without errors
- Base image is node:22-bookworm-slim
- All Chrome dependencies installed
- Layer caching optimized (package files copied before source)
- Chrome Headless Shell installed via remotion browser ensure
- HEALTHCHECK instruction present with correct parameters

---

#### Task Group 2: Entrypoint Script
**Dependencies:** Task Group 1

- [x] 2.0 Complete entrypoint script implementation
  - [x] 2.1 Create docker-entrypoint.sh script
    - Location: /app/docker-entrypoint.sh (copied during build)
    - Use #!/bin/sh for POSIX compatibility
    - Set -e for exit on error
  - [x] 2.2 Implement AWS credential reading from secrets
    - Read /run/secrets/aws_client_id content
    - Export as AWS_ACCESS_KEY_ID environment variable
    - Read /run/secrets/aws_client_secret content
    - Export as AWS_SECRET_ACCESS_KEY environment variable
  - [x] 2.3 Add secret file validation
    - Check if /run/secrets/aws_client_id exists
    - Check if /run/secrets/aws_client_secret exists
    - Exit with descriptive error if either is missing
  - [x] 2.4 Execute server with proper signal handling
    - Use `exec npm run server` to replace shell process
    - Ensures Node receives SIGTERM for graceful shutdown

**Acceptance Criteria:**
- Entrypoint script is executable (chmod +x)
- AWS credentials correctly exported from secret files
- Validation fails gracefully with clear error messages
- Uses exec for proper signal handling
- Server starts successfully when secrets are present

---

#### Task Group 3: Docker Compose Integration
**Dependencies:** Task Group 2

- [x] 3.0 Complete docker-compose integration
  - [x] 3.1 Create docker-compose.yaml file
    - Service name: cawpile-video
    - Image name: cawpile-video
    - Restart policy: unless-stopped
  - [x] 3.2 Configure port mapping and environment
    - Port mapping: 8014 (host) to 3001 (container)
    - Environment: AWS_REGION=us-east-2, S3_BUCKET_NAME=cawpile-downloads
  - [x] 3.3 Configure Docker secrets
    - Define aws_client_id secret from ./secrets/aws_client_id
    - Define aws_client_secret secret from ./secrets/aws_client_secret
    - Attach both secrets to cawpile-video service
  - [x] 3.4 Create secrets directory structure
    - Create ./secrets/ directory
    - Add .gitignore to prevent credential files from being committed
    - Add placeholder/example files documenting expected format

**Acceptance Criteria:**
- docker-compose.yaml follows provided configuration
- Port 8014 maps to container port 3001
- Secrets properly defined and attached to service
- ./secrets/ directory exists with .gitignore protection
- docker-compose config validates without errors

---

### Configuration Layer

#### Task Group 4: Remotion Configuration Update
**Dependencies:** None (can run in parallel with Task Group 1)

- [x] 4.0 Update Remotion configuration for Linux containers
  - [x] 4.1 Enable multi-process rendering on Linux
    - Update remotion.config.ts
    - Add enableMultiProcessOnLinux: true for better container performance
    - Verify existing configuration is not disrupted

**Acceptance Criteria:**
- remotion.config.ts includes enableMultiProcessOnLinux: true
- Existing configuration remains functional
- Config syntax is valid TypeScript

---

### Validation Layer

#### Task Group 5: Build and Integration Testing
**Dependencies:** Task Groups 1-4

- [x] 5.0 Validate complete Docker setup
  - [x] 5.1 Build Docker image successfully
    - Run `docker build -t cawpile-video .`
    - Verify build completes without errors
    - Check image size is reasonable
  - [x] 5.2 Test container startup with mock secrets
    - Create test secret files in ./secrets/
    - Run `docker-compose up -d`
    - Verify container starts and stays running
  - [x] 5.3 Validate health check endpoint
    - Wait for container to be healthy
    - Verify /health endpoint returns `{ status: 'ok', ... }`
    - Check Docker reports container as healthy
  - [x] 5.4 Verify AWS credential injection
    - Exec into running container
    - Confirm AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
    - Verify validateAwsEnv() passed (server started without error)
  - [x] 5.5 Test graceful shutdown
    - Run `docker-compose down`
    - Verify container stops cleanly without timeout
    - Check for clean shutdown logs

**Acceptance Criteria:**
- Docker image builds successfully
- Container starts and reaches healthy state
- Health check endpoint responds correctly
- AWS credentials properly injected from secrets
- Graceful shutdown works (no SIGKILL needed)
- All validation tests pass

---

## Execution Order

Recommended implementation sequence:

```
Parallel Phase 1:
  - Task Group 1: Dockerfile Creation
  - Task Group 4: Remotion Configuration Update

Sequential Phase 2:
  - Task Group 2: Entrypoint Script (depends on Dockerfile)

Sequential Phase 3:
  - Task Group 3: Docker Compose Integration (depends on Entrypoint)

Final Phase:
  - Task Group 5: Build and Integration Testing (depends on all above)
```

## File Deliverables

| File | Purpose |
|------|---------|
| `Dockerfile` | Container image definition |
| `docker-entrypoint.sh` | AWS credential handling and startup |
| `docker-compose.yaml` | Service orchestration configuration |
| `secrets/.gitignore` | Prevent credential file commits |
| `remotion.config.ts` | Updated with Linux multi-process setting |

## Notes

- No application code changes required - existing server/index.ts and validation work as-is
- Health endpoint already exists at /health in server/index.ts
- AWS credential validation happens at server startup via validateAwsEnv()
- S3 client initializes lazily and will use exported credentials
