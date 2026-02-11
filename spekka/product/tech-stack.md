# Tech Stack

Complete technical stack documentation for the Cawpile Video Generation Service.

## Core Platform

### TypeScript 5.6
**Purpose:** Primary programming language for type-safe development
**Rationale:** Strong typing prevents runtime errors in video composition logic; excellent tooling support; seamless integration with React and Node.js ecosystem; critical for maintaining complex animation timing calculations and API contracts.

### Node.js (via Express runtime)
**Purpose:** Server runtime environment
**Rationale:** Required for Express server; excellent async I/O for handling render requests; mature ecosystem; compatible with Remotion's bundling and rendering APIs.

## Video Generation

### Remotion 4.0
**Purpose:** Programmatic video composition engine
**Rationale:** React-based video creation enables component reusability; frame-based precision for animation timing; server-side rendering without browser; TypeScript-first API; designed specifically for programmatic video generation use cases.

### React 18.3
**Purpose:** Component framework for video composition
**Rationale:** Required by Remotion; component model maps naturally to video sequences; hooks enable clean animation logic; familiar development paradigm for maintainability.

## Server & API

### Express 4.21
**Purpose:** HTTP server framework
**Rationale:** Lightweight and mature; minimal overhead for API endpoints; middleware ecosystem for logging and error handling; straightforward integration with Remotion's bundling and rendering APIs; SSE support for streaming progress updates.

## Storage & Infrastructure

### AWS S3
**Purpose:** Rendered video storage and delivery
**Rationale:** Reliable object storage with CDN integration; scalable without infrastructure management; industry-standard for video hosting; direct integration with Remotion's render output; secure credential-based access.

### Docker
**Purpose:** Containerization and deployment
**Rationale:** Consistent runtime environment across development and production; packages required system fonts (Noto Color Emoji for star ratings); simplifies AWS credential management via Docker secrets; enables easy orchestration and scaling.

## Testing

### Vitest
**Purpose:** Test framework for unit and integration tests
**Rationale:** Fast execution with native ESM support; TypeScript-first design; compatible with Vite-based tooling; modern alternative to Jest with better performance; supports both server endpoint tests and composition logic tests.

## Development Tools

### ESLint
**Purpose:** Code quality and consistency enforcement
**Rationale:** Catches common errors; enforces consistent code style; TypeScript-aware linting rules; integrates with editor tooling for immediate feedback.

### tsconfig.json Path Aliases
**Purpose:** Clean import paths (`@/*` maps to `src/*`)
**Rationale:** Reduces import complexity; improves code readability; prevents relative path maintenance issues when restructuring; standard pattern in TypeScript projects.

## Video Output Format

### H.264 Codec
**Purpose:** Video encoding format
**Rationale:** Universal playback support across social media platforms (TikTok, Instagram); excellent quality-to-file-size ratio; hardware-accelerated decoding on mobile devices; industry standard for web video delivery.

### 1080x1920 @ 30fps (9:16 aspect ratio)
**Purpose:** TikTok-optimized vertical video format
**Rationale:** Native aspect ratio for TikTok and Instagram Reels; 1080p resolution balances quality and file size; 30fps is standard for social media content; matches platform specifications for optimal playback.

## System Dependencies

### Noto Color Emoji Font
**Purpose:** Emoji rendering in videos (e.g., star ratings)
**Rationale:** Cross-platform consistent emoji appearance; included in Docker image; ensures star ratings and emojis render identically regardless of host system; open-source and freely redistributable.

## Architecture Patterns

### Microservice Architecture
**Purpose:** Isolated video generation service
**Rationale:** Single responsibility (video generation); independent deployment from main Cawpile platform; horizontal scaling based on render demand; clear API boundaries for integration; fault isolation.

### Server-Sent Events (SSE)
**Purpose:** Real-time render progress streaming
**Rationale:** Lightweight alternative to WebSockets for one-way progress updates; works over standard HTTP; simple client integration; enables monitoring of long-running render operations; no complex connection management.

### Frame-Based Animation System
**Purpose:** Precise animation timing at 30fps
**Rationale:** Deterministic timing (no millisecond ambiguity); frame numbers are more intuitive for video work; aligns with Remotion's core model; easier to debug and test animation sequences; consistent playback across devices.

## Development Workflow

### npm Scripts
**Purpose:** Standard task automation
**Rationale:** `npm run dev` for Remotion Studio preview; `npm run server` for API development; `npm run render` for command-line rendering; `npm run test` for validation; consistent across team and CI/CD environments.

## Security & Credentials

### Docker Secrets
**Purpose:** Secure AWS credential management
**Rationale:** Keeps credentials out of environment variables and code; mounted at `/run/secrets/` in container; integrates with orchestration platforms; follows security best practices for containerized services.
