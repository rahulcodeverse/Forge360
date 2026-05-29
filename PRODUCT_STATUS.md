# Forge360 Product Status

This project is being built toward a full enterprise HRMS / Workforce OS comparable in scope to Keka, Darwinbox, Rippling, BambooHR, Workday, and Zoho People.

## What Is Working Locally Now

Run:

```bash
npm start
```

Open:

```text
http://localhost:4200
```

The local application currently includes working screens and local API data for:

- Dashboard
- People and Core HR
- Recruitment ATS
- Leave Management
- Payroll Runs
- Global Compliance Rules
- Workflow Builder
- Dynamic Forms
- Analytics
- Forge360 AI overview

It also exposes local API endpoints for those modules.

## What This Is Not Yet

This is not yet a complete production SaaS like Keka or Workday.

Missing production requirements include:

- Real PostgreSQL persistence wired to every module
- Full authentication, SSO, MFA, RBAC, and ABAC enforcement
- Production payroll execution with approval locks and audit traces
- Real compliance filing generation
- File uploads, document storage, e-signatures, and PDF generation
- Background jobs, queues, notifications, email, SMS, and push
- Real AI integrations, OCR, resume parsing, and prediction models
- Tenant provisioning, billing, subscription plans, and usage metering
- Kubernetes production deployment with observability and backups

## Build Direction

The correct path is to build this as real vertical slices:

1. Authentication and tenant setup.
2. Core HR with PostgreSQL persistence.
3. Leave and attendance with approval workflows.
4. Payroll engine with configurable formulas and audit traces.
5. Compliance, forms, documents, and reporting.
6. Recruitment, onboarding, performance, learning, assets, helpdesk, and exit.
7. AI, analytics, integrations, mobile APIs, and production deployment.

The most important rule remains: no country-specific payroll, tax, compliance, or labor logic should be hardcoded. It must be configured as tenant data.
