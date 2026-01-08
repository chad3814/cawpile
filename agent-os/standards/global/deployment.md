## Deployment & Infrastructure

### Platform
- Serverless container platform, managed relational database, infrastructure-as-code tool, CI/CD pipeline with OIDC authentication
- Environments: `main` branch � production, `staging` branch � staging

### CI/CD Workflows
- **deploy workflow**: Push to main/staging � build container image � run tests � apply infrastructure � run database migrations
- **pr-check workflow**: PRs � build � test � plan infrastructure changes (no apply, uses staging env)
- All workflows use OIDC authentication for secure cloud provider access

### Container Multi-Stage Build
```text
base (dependencies) � dev (local development with hot reload)
                   � builder (optimized build) � production (minimal runtime)
                   � test (CI testing environment)
```

### Infrastructure Core Resources
- Virtual private network + NAT gateway for container egress
- Managed relational database (private network, automated backups)
- Object storage (public bucket for static assets with versioning)
- Secret management service (database URLs, API keys)
- Serverless container service (minimum scale 1, VPC egress)
- Container jobs (test runner, database migrations, optional post-deploy scripts)

### Secret Management
**Infrastructure-managed:** Database connection strings, database credentials
**Manual (set via CLI):** Application secrets, API keys for third-party services, monitoring/observability tokens

**CI/CD secrets:** Cloud provider credentials, infrastructure state backend configuration, deployment service account keys
**CI/CD variables (per env):** Region/zone, application name, custom domain configuration

### Database Migrations
- Auto-applied via container job after infrastructure deployment in pipeline
- Zero-downtime pattern: add nullable column � deploy code writing to it � backfill � make non-null
- No automatic rollback; test thoroughly on staging first
- Automated database backups daily at 4 AM UTC

### Rollback
```bash
# Application rollback
# Use CLI or console to route 100% traffic to previous container revision

# Database rollback (manual)
# 1. Restore from automated database backup, OR
# 2. Create new migration to undo changes
```

### Monitoring & Observability
- Application performance monitoring (APM) for request tracing
- Centralized logging with structured JSON logs
- Error tracking and alerting service integration
- Custom metrics for business KPIs
- Uptime monitoring and alerting

### Security Best Practices
- Use managed service identities for inter-service authentication
- Store all secrets in dedicated secret management service
- Enable encryption at rest and in transit
- Implement least-privilege access controls
- Regular security scanning of container images
- Enable automated security patching for managed services

### Disaster Recovery
- Automated daily database backups with point-in-time recovery
- Infrastructure-as-code in version control for reproducibility
- Multi-region deployment option for critical applications
- Documented runbook for common incident scenarios
- Regular disaster recovery drills

### Cost Optimization
- Use auto-scaling with appropriate minimum/maximum instances
- Implement request-based scaling for serverless containers
- Schedule non-production environments to scale down during off-hours
- Use reserved capacity for predictable baseline load
- Monitor and set budget alerts
- Regular review of resource utilization
