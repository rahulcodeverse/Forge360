# Forge360 Workforce OS

**Tagline:** Building Better Workplaces

Forge360 is an enterprise Workforce Operating System blueprint and starter codebase for managing the full employee lifecycle from recruitment to retirement. It is designed as a multi-tenant, globally configurable SaaS platform with no hardcoded country-specific HR, payroll, tax, or compliance rules.

## Platform Scope

- Core HR, organization management, ATS, onboarding, attendance, leave, shifts, payroll, compliance, forms, workflows, policies, expenses, performance, LMS, assets, engagement, helpdesk, exit management, AI, analytics, integrations, billing, and localization.
- Angular 20+ frontend architecture with NG-ZORRO, SCSS, RxJS, Signals, PWA readiness, responsive layouts, and dark mode.
- NestJS backend architecture with PostgreSQL, Redis, Elasticsearch, GraphQL, REST APIs, WebSockets, audit logging, RBAC, ABAC, and multi-tenant isolation.
- Docker, Kubernetes, CI/CD, and cloud-native deployment structure.

## Important Design Principle

Country-specific logic is modeled as data, not code.

Payroll components, compliance forms, labor rules, tax slabs, benefit rules, statutory reports, leave policies, overtime rules, tax-year calendars, and localization settings are configured through rule engines and effective-dated policy records.

Examples such as PF, ESIC, Form 16, W2, W4, 1099, PAYE, National Insurance, WPS, and Gratuity should be created by administrators or implementation partners using configurable rule definitions.

## Repository Layout

```text
apps/
  api/                       NestJS API gateway and service composition
  web/                       Angular shell and module route registry
libs/
  domain/                    Shared domain contracts
  rule-engine/               Configurable rules, formulas, slabs, and policies
docs/
  architecture.md
  database-design.md
  er-diagrams.md
  microservices.md
  api-documentation.md
  rbac-matrix.md
  wireframes.md
  user-flows.md
  deployment-guide.md
  testing-strategy.md
infra/
  docker/
  k8s/
  database/
config/
.github/workflows/
```

## Local Development

```bash
npm install
npm run lint
npm run test
npm run build
docker compose -f infra/docker/docker-compose.yml up
```

The current repository is a scalable enterprise starter, not a finished commercial HR suite. It establishes the architecture, contracts, module boundaries, configurable engines, deployment baseline, and documentation needed to build the full platform safely.

## Implemented Starter APIs

- `GET /api/v1/health`
- `GET /api/v1/workforce/suite`
- `GET /api/v1/workforce/modules`
- `GET /api/v1/employees`
- `GET /api/v1/employees/:id`
- `POST /api/v1/employees`
- `GET /api/v1/organization/units`
- `GET /api/v1/organization/org-chart`
- `GET /api/v1/rules`
- `POST /api/v1/rules`
- `POST /api/v1/rules/evaluate`
- `GET /api/v1/platform/capabilities`
- `GET /api/v1/platform/security`
- `GET /api/v1/platform/analytics`
- `GET /api/v1/platform/ai`
