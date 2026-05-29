# Testing Strategy

## Test Types

- Unit tests: rule evaluation, policy resolution, formula validation, permission checks.
- Contract tests: service APIs, event schemas, webhook signatures.
- Integration tests: PostgreSQL persistence, Redis queues, Elasticsearch indexing.
- End-to-end tests: recruitment, onboarding, leave, payroll, compliance filing, exit.
- Security tests: RBAC, ABAC, tenant isolation, audit logging, session revocation.
- Performance tests: 100,000+ employee tenants, payroll runs, search, dashboard queries.
- Accessibility tests: Angular UI keyboard navigation, contrast, screen reader labels.

## Critical Scenarios

- No tenant can read another tenant's data.
- Payroll calculations are reproducible from stored rule versions.
- Compliance logic changes only through approved rule versions.
- Dynamic fields survive schema evolution.
- Workflow version changes do not mutate in-flight workflow instances.
- AI answers cite tenant-approved sources and respect permissions.

