# Specification: Containerize for EC2

## Goal
Containerize the Remotion video generation application for deployment on an existing EC2 instance using Docker and docker-compose, with secure AWS credential handling via Docker secrets.

## User Stories
- As a DevOps engineer, I want to deploy the video generation service in a Docker container so that it runs consistently across environments
- As a system administrator, I want AWS credentials handled securely via Docker secrets so that sensitive data is not exposed in environment variables or compose files

## Specific Requirements

**Dockerfile following Remotion's official recommendations**
- Use `node:22-bookworm-slim` as the base image (Debian preferred over Alpine for stability)
- Install Chrome Headless Shell system dependencies: libnss3, libdbus-1-3, libatk1.0-0, libgbm-dev, libasound2, libxrandr2, libxkbcommon-dev, libxfixes3, libxcomposite1, libxdamage1, libatk-bridge2.0-0, libpango-1.0-0, libcairo2, libcups2
- Copy package.json and package-lock.json first, then run npm install for layer caching
- Copy remaining source files (src/, server/, remotion.config.ts, tsconfig.json)
- Run `npx remotion browser ensure` to install Chrome Headless Shell
- Expose port 3001 for the Express server
- Set NODE_ENV=production

**Entrypoint script for AWS credential handling**
- Create shell script at `/app/docker-entrypoint.sh`
- Read `/run/secrets/aws_client_id` file content and export as `AWS_ACCESS_KEY_ID`
- Read `/run/secrets/aws_client_secret` file content and export as `AWS_SECRET_ACCESS_KEY`
- Validate that both secret files exist before starting application
- Execute the server command: `npm run server`
- Use `exec` to replace shell process with Node process for proper signal handling

**docker-compose.yaml integration**
- Image name: `cawpile-video`
- Restart policy: `unless-stopped`
- Port mapping: 8014 (host) to 3001 (container)
- Environment variables: AWS_REGION=us-east-2, S3_BUCKET_NAME=cawpile-downloads
- Secrets: aws_client_id and aws_client_secret from files in ./secrets/ directory

**Health check configuration**
- Existing /health endpoint returns `{ status: 'ok', timestamp: '...' }`
- Add Docker HEALTHCHECK instruction using curl or wget to /health endpoint
- Set appropriate interval (30s), timeout (10s), and retries (3)

**Output directory handling**
- Create /app/out directory with appropriate permissions
- Server already creates OUTPUT_DIR if it does not exist

**Chromium rendering configuration**
- Enable `enableMultiProcessOnLinux: true` for better performance in Linux containers
- Container will inherit CPU resources from EC2 instance (no explicit limits needed)

## Existing Code to Leverage

**server/index.ts - Express server entry point**
- Server already listens on PORT from environment (default 3001)
- /health endpoint already implemented and returns JSON status
- validateAwsEnv() called at startup validates all required AWS env vars
- No code changes required - server expects AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME

**server/lib/validateEnv.ts - Environment validation**
- REQUIRED_AWS_ENV_VARS array defines: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME
- validateAwsEnv() throws descriptive error if any variable is missing
- Entrypoint must set credentials before server starts so validation passes

**server/lib/s3.ts - S3 client configuration**
- S3 client initialized lazily from environment variables
- getS3Config() reads AWS credentials at runtime
- Compatible with credentials set by entrypoint script

**package.json - npm scripts**
- `npm run server` command runs `tsx server/index.ts`
- All dependencies defined in package.json for container installation

## Out of Scope
- CI/CD pipeline configuration (GitHub Actions, CodePipeline, etc.)
- Nginx reverse proxy setup
- HTTPS/TLS termination configuration
- Auto-scaling configuration (ECS, ASG, etc.)
- EC2 instance provisioning or AMI creation
- CloudWatch or other monitoring integration
- Container orchestration (ECS, Kubernetes, Docker Swarm)
- Multi-region deployment
- Database or persistent storage configuration
- Load balancer setup
