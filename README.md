# Enterprise HRMS

Production-oriented HRMS monorepo for a globally deployable workforce platform comparable in scope to Keka, Darwinbox, Zoho People, SAP SuccessFactors, and Workday.

## Stack

- Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui pattern, Zustand, TanStack Query, React Hook Form, Zod, TanStack Table, Recharts, D3, next-intl.
- Backend: NestJS 10, TypeScript, Prisma 5, Passport JWT/SSO hooks, BullMQ, Socket.io, OpenAPI.
- Data: PostgreSQL 16 schema-per-tenant, Redis 7, Elasticsearch/OpenSearch, S3/MinIO.
- Infra: Docker Compose, Kubernetes/Helm, Terraform, GitHub Actions, Prometheus/Grafana/Loki/Jaeger/Sentry-ready.

## Local Setup

```bash
pnpm install
cp .env.example .env
docker compose -f infra/docker/docker-compose.yml up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Implemented Foundation

This commit establishes the first production slice:

- Monorepo structure matching the requested architecture.
- Prisma schema covering tenants, auth, employees, attendance, leave, payroll, workflows, performance, recruitment, learning, expenses, assets, documents, notifications, webhooks, feature flags, and audit logs.
- Deterministic seed data for Acme Corp across India, UK, and US.
- Core business engines for leave balances, approval workflow routing, payroll calculation, and audit entries.
- Tests proving leave approval deducts balance, LOP feeds payroll, and approvals are audited.
- API/web app shells in the requested frameworks.

## Quality Gates

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Design Rules

- Every tenant is isolated by PostgreSQL schema.
- Every state-changing operation writes an audit event.
- Sensitive fields are encrypted before persistence.
- Country payroll/compliance behavior is implemented as plugins/configuration, never mixed into core payroll logic.
- UI text is routed through i18n keys.

