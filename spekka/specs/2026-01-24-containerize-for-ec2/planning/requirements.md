# Spec Requirements: Containerize for EC2

## Initial Description
Containerize the Remotion video generation application for deployment on an existing EC2 instance using Docker and docker-compose.

## Requirements Discussion

### First Round Questions

**Q1:** Container runtime - Docker or another container runtime?
**Answer:** Docker - confirmed

**Q2:** Base image preferences - Node.js official images, Alpine variants, or Remotion-specific recommendations?
**Answer:** Follow Remotion's official Docker recommendations for base image

**Q3:** Deployment model - single container or orchestration (ECS, Kubernetes)?
**Answer:** Single container deployment on EC2 (instance already ready)

**Q4:** EC2 instance sizing recommendations needed?
**Answer:** Instance is already set up - no sizing recommendations needed

**Q5:** AWS credential handling approach?
**Answer:** Using docker-compose with secrets for AWS credentials

**Q6:** Health check and monitoring requirements?
**Answer:** /health endpoint is sufficient

**Q7:** Build optimization preferences (multi-stage builds, layer caching)?
**Answer:** Follow Remotion's official Docker recommendations (likely multi-stage)

**Q8:** Scope boundaries - what's explicitly out of scope?
**Answer:** Scope is just Dockerfile + docker-compose integration - no CI/CD, nginx, HTTPS, auto-scaling

### Existing Code to Reference
No similar existing features identified for reference.

### Follow-up Questions

**Follow-up 1:** How should the entrypoint handle AWS credentials from Docker secrets?
**Answer:** The entrypoint script will read the secret files at `/run/secrets/aws_client_id` and `/run/secrets/aws_client_secret`, then set them as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables before starting the application. No application code changes needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements
- Dockerfile that containerizes the Remotion video generation application
- Follow Remotion's official Docker recommendations for base image and build strategy
- Entrypoint script that reads Docker secrets and sets AWS credential environment variables
- /health endpoint for basic health checking
- Integration with provided docker-compose.yaml configuration

### Docker Compose Configuration (User-Provided)
```yaml
services:
  cawpile-video:
    image: cawpile-video
    restart: unless stopped
    environment:
      - AWS_REGION=us-east-2
      - S3_BUCKET_NAME=cawpile-downloads
    ports:
      - 8014:3001
    secrets:
      - aws_client_id
      - aws_client_secret

secrets:
  aws_client_id:
    file: secrets/aws_client_id
  aws_client_secret:
    file: secrets/aws_client_secret
```

### Credential Handling Specification
- Secret files mounted at `/run/secrets/aws_client_id` and `/run/secrets/aws_client_secret`
- Entrypoint script reads these files and exports as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- No application code modifications required - credentials available as standard AWS environment variables

### Reusability Opportunities
- None identified - this is new Docker infrastructure

### Scope Boundaries
**In Scope:**
- Dockerfile following Remotion's official Docker recommendations
- Entrypoint script for AWS credential handling from Docker secrets
- /health endpoint implementation (if not already present)
- docker-compose.yaml file (provided by user)

**Out of Scope:**
- CI/CD pipeline configuration
- Nginx reverse proxy setup
- HTTPS/TLS termination
- Auto-scaling configuration
- EC2 instance provisioning or configuration
- CloudWatch or other monitoring integration

### Technical Considerations
- Application runs on port 3001 internally, mapped to 8014 externally
- Must support Remotion's rendering requirements (likely Chromium/Puppeteer dependencies)
- AWS SDK credentials passed via environment variables (standard AWS SDK credential chain)
- Container restart policy: unless-stopped
- AWS Region: us-east-2
- S3 Bucket: cawpile-downloads
