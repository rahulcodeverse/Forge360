# HRMS — Production-Grade Enterprise Human Resource Management System

A globally deployable HRMS functionally equivalent to Keka, Darwinbox, SAP SuccessFactors, and Workday. Supports 10–100,000+ employees across any country.

---

## Architecture Overview

```
hrms/
├── apps/
│   ├── web/              # Next.js 14 (App Router) — employee & manager portal
│   ├── api/              # NestJS 10 — REST API + WebSocket gateway
│   ├── pdf-service/      # Puppeteer microservice — payslip PDF rendering
│   └── worker/           # BullMQ workers — async job processing
├── packages/
│   ├── database/         # Prisma 5 schema, migrations, seed
│   ├── shared-types/     # Zod schemas shared between FE & BE
│   ├── ui/               # shadcn/ui component library
│   ├── config/           # ESLint, TypeScript, Tailwind base configs
│   └── email-templates/  # MJML email templates
├── infra/
│   ├── docker/           # Dockerfiles + docker-compose.yml
│   ├── k8s/              # Kubernetes Helm chart
│   └── terraform/        # AWS IaC (EKS, RDS Aurora, ElastiCache, S3, ECR)
├── docs/
│   ├── adr/              # Architecture Decision Records
│   ├── compliance/       # Country-specific statutory documentation
│   ├── runbooks/         # Operations runbooks
│   └── security/         # OWASP ASVS checklist, threat model
└── load-tests/           # k6 load test scripts
```

### Multi-tenancy

Schema-per-tenant isolation in PostgreSQL. Each company gets its own PostgreSQL schema. A NestJS `TenantGuard` resolves the correct schema from the JWT claim before every request. See [ADR 0001](docs/adr/0001-multi-tenancy.md).

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript 5, Tailwind CSS v3, shadcn/ui |
| State | Zustand (client) + TanStack Query v5 (server) |
| Backend | NestJS 10, TypeScript 5, Passport.js (JWT + SAML + OAuth2) |
| Database | PostgreSQL 16 (Aurora), Prisma 5 ORM |
| Cache/Queue | Redis 7 (ElastiCache), BullMQ 5 |
| Search | Elasticsearch 8 / OpenSearch |
| Storage | AWS S3 (MinIO for local dev) |
| Email | Nodemailer + MJML (AWS SES in prod) |
| SMS | Twilio SDK |
| PDF | Puppeteer microservice |
| Monitoring | Prometheus + Grafana + Loki + Jaeger + Sentry |
| Infra | Docker → Kubernetes (EKS), Terraform, GitHub Actions |

---

## Modules

| # | Module | Status |
|---|---|---|
| 1 | Auth (JWT, MFA/TOTP, RBAC, SAML, OAuth2) | ✅ |
| 2 | Employee Management + Org Chart + Bulk Import | ✅ |
| 3 | Attendance Engine + Shift Management | ✅ |
| 4 | Leave Engine (Policy, Balances, Multi-level Approval) | ✅ |
| 5 | Payroll Engine (Formula Engine, Statutory Plugins, PDF) | ✅ |
| 6 | Performance Management (Goals, Reviews, Calibration) | ✅ |
| 7 | Recruitment ATS | ✅ |
| 8 | Learning & Development | ✅ |
| 9 | Reports & Analytics | ✅ |
| 10 | Employee Self-Service Portal | ✅ |
| 11 | Manager Self-Service | ✅ |
| 12 | Notifications (WebSocket + Email + SMS) | ✅ |
| 13 | Country Compliance (India, US, UK, UAE) | ✅ |

---

## Local Development Setup

### Prerequisites

- Node.js 20 LTS
- pnpm 9
- Docker Desktop

### One-command startup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment config
cp .env.example .env
# Edit .env — at minimum set JWT secrets and ENCRYPTION_KEY (≥32 chars each)

# 3. Start infrastructure (PostgreSQL, Redis, MinIO, MailHog)
docker-compose -f infra/docker/docker-compose.yml up -d

# 4. Run database migrations
pnpm db:migrate:dev

# 5. Seed demo data (50 employees, 3 payroll runs, etc.)
pnpm db:seed

# 6. Start all apps in watch mode
pnpm dev
```

### Service URLs (local)

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger docs | http://localhost:3001/api/docs |
| PDF service | http://localhost:3002 |
| MailHog (email UI) | http://localhost:8025 |
| MinIO console | http://localhost:9001 |
| Prisma Studio | `pnpm db:studio` |

### Demo credentials

| Role | Email | Password |
|---|---|---|
| HR Admin | admin@acme.hrms.local | Admin@12345 |
| Employee | rahul.sharma@acme.com | Employee@123 |

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `REDIS_URL` | Redis connection URL | ✅ |
| `JWT_ACCESS_SECRET` | JWT access token secret (≥32 chars) | ✅ |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (≥32 chars) | ✅ |
| `ENCRYPTION_KEY` | AES-256 key for PII encryption (≥32 chars) | ✅ |
| `TOTP_ENCRYPTION_KEY` | AES key for TOTP secret storage (≥32 chars) | ✅ |
| `S3_BUCKET_NAME` | AWS S3 / MinIO bucket name | ✅ |
| `AWS_REGION` | AWS region | ✅ |
| `S3_ENDPOINT` | MinIO endpoint (dev only) | Local dev |
| `SMTP_HOST` | SMTP host | Email |
| `EMAIL_FROM` | From address for emails | Email |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | SMS |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | SMS |

See [`.env.example`](.env.example) for the full list.

---

## Common Commands

```bash
# Run all tests
pnpm test

# Type-check all packages
pnpm typecheck

# Lint all packages
pnpm lint

# Create a new database migration
pnpm db:migrate:dev --name <migration-name>

# Open Prisma Studio (visual DB browser)
pnpm db:studio

# Build all apps for production
pnpm build

# Run E2E tests
pnpm --filter @hrms/web test:e2e

# Run k6 load tests (requires k6 installed)
k6 run load-tests/attendance-clock.js
k6 run load-tests/payroll-run.js
```

---

## Deployment

### Docker (production build)

```bash
docker build -f infra/docker/Dockerfile.api -t hrms-api .
docker build -f infra/docker/Dockerfile.web -t hrms-web .
docker build -f infra/docker/Dockerfile.worker -t hrms-worker .
docker build -f infra/docker/Dockerfile.pdf-service -t hrms-pdf-service .
```

### Kubernetes (Helm)

```bash
# Prerequisites: kubectl configured, ECR images pushed
helm upgrade --install hrms ./infra/k8s/helm \
  --namespace hrms \
  --create-namespace \
  --set global.imageTag=<SHA> \
  --set global.registry=<ECR_REGISTRY> \
  --values ./infra/k8s/helm/values-production.yaml
```

### Terraform (AWS infrastructure)

```bash
cd infra/terraform
terraform init
terraform plan -var="environment=production"
terraform apply -var="environment=production"
```

---

## Security

- All PII (PAN, bank account) encrypted at rest with AES-256 (KMS-managed keys)
- JWT access tokens expire in 15 minutes; refresh tokens in Redis with rotation
- MFA via TOTP (RFC 6238) — Google Authenticator compatible
- Rate limiting: 100 req/min (unauthenticated), 1000 req/min (authenticated)
- CORS, HSTS, CSP, XSS protection headers via Helmet
- Secrets scanning with GitLeaks in CI
- Dependency auditing with `npm audit` + Snyk in CI
- Immutable audit log on every state-changing operation

See [`docs/security/`](docs/security/) for threat model, OWASP ASVS checklist, and secret rotation procedure.

---

## Compliance

| Country | Computations |
|---|---|
| India | PF (12%), ESI (0.75%/3.25%), PT (slab-based), TDS (old & new regime), Gratuity Act |
| US | FICA (Social Security 6.2%, Medicare 1.45%), FUTA, Federal withholding (W-4) |
| UK | PAYE, NI Class 1 employee (8%) and employer (13.8%) |
| UAE | No income tax; End-of-service gratuity (UAE Labour Law) |

See [`docs/compliance/`](docs/compliance/) for per-country statutory calculation documentation.

---

## Contributing

See [Architecture Decision Records](docs/adr/) for major design decisions.  
Open issues and PRs on GitHub. All contributions require passing `pnpm test && pnpm lint && pnpm typecheck`.
