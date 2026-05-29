# ADR 0001 — Multi-tenancy: Schema-per-Tenant

**Status**: Accepted  
**Date**: 2026-05-29

## Context

The HRMS serves multiple companies. Data isolation between tenants is a hard requirement — a payroll bug in Tenant A must never expose Tenant B's salary data.

Three options were evaluated:
1. **Row-level multi-tenancy** — single schema, `tenant_id` column on every table
2. **Schema-per-tenant** — separate PostgreSQL schema per company, shared DB instance
3. **Database-per-tenant** — separate PostgreSQL instance per company

## Decision

**Schema-per-tenant** was chosen.

### Rationale

- Complete SQL isolation: a `SET search_path TO "acme"` before any query makes cross-tenant leakage structurally impossible, unlike row-level filtering which can be bypassed by a missing `WHERE tenant_id = ?`.
- Single DB instance: operational simplicity vs. database-per-tenant; connection pool shared across tenants.
- Prisma multi-schema: `SET search_path` injected in `PrismaService.withTenantSchema()` before every transaction; the NestJS tenant middleware resolves the schema from the JWT claim on each request.
- Migrations run per-schema via a provisioning job (BullMQ); new tenants get fully migrated schemas asynchronously.

### Trade-offs

- Schema count grows with tenants. At >10,000 tenants, cross-tenant analytics (super-admin dashboard) requires either foreign data wrappers or a separate reporting aggregation layer.
- `pg_catalog` queries across all schemas are slower — acceptable at current scale.

## Consequences

- `X-Tenant-ID` header is mandatory on all authenticated API calls.
- NestJS `TenantGuard` enforces that JWT `tenantId` matches the header.
- Tenant provisioning takes ~5 seconds (schema create + migrate + seed) — handled async via BullMQ.
- Super-admin queries that span all tenants use a dedicated `public` schema summary table updated by scheduled jobs.
