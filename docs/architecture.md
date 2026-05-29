# Complete System Architecture

Forge360 uses a modular multi-tenant SaaS architecture. Each tenant can configure legal entities, countries, currencies, time zones, tax years, fields, policies, workflows, payroll structures, compliance rules, forms, integrations, branding, and subscription limits.

## Logical Layers

1. Experience layer: Angular web app, PWA shell, mobile apps, employee self-service, manager workspace, admin console, career portal, integration admin, analytics studio.
2. API layer: NestJS API gateway exposing REST, GraphQL, WebSocket, and webhook endpoints.
3. Domain services: Core HR, organization, recruitment, onboarding, attendance, leave, shifts, payroll, compliance, forms, workflows, policies, expenses, performance, LMS, assets, engagement, helpdesk, exit, AI, analytics, billing, marketplace, notifications.
4. Platform services: tenant resolution, identity, RBAC, ABAC, audit, encryption, document storage, search indexing, event bus, scheduler, rules engine, feature flags, localization.
5. Data layer: PostgreSQL for transactional data, Redis for caching and queues, Elasticsearch for search and analytics indexing, object storage for files, warehouse/lakehouse for BI.

## Multi-Tenant Strategy

- Tenant context is mandatory on every request, event, job, webhook, and audit record.
- PostgreSQL uses tenant-scoped tables by default, with optional schema or database isolation for large enterprise tenants.
- Sensitive tables support row-level security, encryption metadata, and audit trails.
- Tenant configuration drives enabled modules, branding, locales, currencies, compliance packs, workflow versions, and subscription limits.

## Configurable Rule Engines

Rules are stored as effective-dated definitions with namespace, conditions, formulas, slabs, metadata, versions, and approval status. Payroll, compliance, leave, attendance, overtime, holiday, tax, and workflow behavior resolve through rule evaluation, not country-specific code branches.

## AI Platform

Forge360 AI is exposed through secure domain tools:

- HR Copilot for policy, leave, payroll, and employee lifecycle questions.
- Recruitment AI for job descriptions, resume ranking, and candidate matching.
- Analytics AI for attrition, retention, workforce planning, and anomaly detection.
- Document Intelligence for OCR, forms, contracts, receipts, and extraction workflows.

AI requests are tenant-scoped, permission checked, audit logged, and grounded in approved tenant documents, policies, and employee data boundaries.

