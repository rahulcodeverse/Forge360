# Full Application Build Roadmap

This repository now contains the first runnable product foundation for Forge360. A complete commercial Workforce OS is a multi-quarter product program, so the build should proceed by bounded vertical slices.

## Phase 1: Platform Foundation

- Tenant provisioning, branding, subscription plans, usage limits.
- Identity, SSO, MFA, session management, RBAC, ABAC.
- Audit log service and tenant-scoped data access.
- PostgreSQL migrations, Redis queues, Elasticsearch indexing.
- Angular shell, navigation, module registry, dark mode, responsive layout.

## Phase 2: Employee Lifecycle Core

- Employee profiles, dynamic fields, documents, banking, education, skills.
- Organization model, reporting hierarchy, interactive org chart.
- Leave, attendance, shift, holiday, overtime, and approval workflows.
- Asset lifecycle and helpdesk ticketing.

## Phase 3: Rule-Driven Payroll and Compliance

- Formula builder, slab builder, component builder, effective dates.
- Payroll cycle orchestration, exception handling, approvals, payslips.
- Compliance form/report builder with tenant-managed templates.
- Full calculation trace and audit evidence for every result.

## Phase 4: Talent, Performance, Learning, Engagement

- ATS, candidate portal, interviews, offers, referrals.
- Onboarding and offboarding workflow automation.
- Goals, OKRs, KPIs, 360 reviews, calibration, promotions.
- LMS, certifications, learning paths, AI recommendations.
- Surveys, pulse checks, recognition, rewards, announcements, social feed.

## Phase 5: AI, BI, Marketplace, Scale

- HR copilot with permissioned retrieval.
- Resume screening, candidate matching, job description generation.
- Attrition prediction, retention prediction, workforce planning.
- OCR for receipts, forms, contracts, and identity documents.
- Dashboard builder, embedded BI, warehouse sync.
- Integration marketplace, webhooks, public APIs, partner SDK.
- Performance hardening for 100,000+ employee tenants.

## Definition of Done

- Each module has database migrations, API contracts, UI screens, authorization tests, audit coverage, and tenant-isolation tests.
- No country-specific behavior is shipped as code branches.
- All statutory, payroll, tax, leave, attendance, and policy behavior is tenant-configured and effective-dated.
