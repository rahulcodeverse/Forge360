# Production Deployment Guide

## Environments

- Development: Docker Compose with PostgreSQL, Redis, Elasticsearch, API, and web shell.
- Staging: Kubernetes namespace mirroring production topology.
- Production: Kubernetes on AWS or Azure with managed PostgreSQL, Redis, OpenSearch/Elasticsearch, object storage, secrets manager, CDN, WAF, and observability stack.

## Deployment Steps

1. Build immutable container images for API and web.
2. Run database migrations with tenant-safe rollout checks.
3. Deploy API, workers, schedulers, and web assets.
4. Verify health checks, readiness probes, and synthetic user journeys.
5. Roll out by tenant segment or region using feature flags.
6. Monitor errors, latency, queue depth, payroll job duration, and audit log ingestion.

## Security Checklist

- TLS everywhere.
- Secrets stored in cloud secrets manager.
- Encryption at rest for database, object storage, cache snapshots, and backups.
- Audit logs are append-only and exported to a protected sink.
- SAML/OAuth clients use tenant-scoped configuration.
- Data residency and retention policies are tenant configurable.

