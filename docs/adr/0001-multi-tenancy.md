# ADR 0001: Schema-Per-Tenant Multi-Tenancy

## Decision

Use one PostgreSQL schema per company tenant. The platform schema stores tenant metadata; tenant schemas store all business data.

## Rationale

This gives stronger operational isolation than row-only tenant mixing while keeping a shared database operational model for SMEs and mid-market customers. Large enterprise tenants can be promoted to dedicated databases without changing domain APIs.

