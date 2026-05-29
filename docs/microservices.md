# Microservice Architecture

Forge360 can start as a modular NestJS monolith and evolve into independently deployable services as tenant scale grows.

## Service Boundaries

- Identity Service: authentication, SSO, MFA, sessions, SAML, OAuth2.
- Tenant Service: tenant lifecycle, branding, subscriptions, limits, isolation policy.
- People Service: employees, profiles, documents, custom fields, org structure.
- Talent Service: ATS, career portal, interviews, offers, referrals, onboarding.
- Time Service: attendance, shifts, leave, holidays, overtime.
- Payroll Service: payroll components, formulas, salary structures, cycles, payslips.
- Compliance Service: rule packs, filings, statutory documents, audit evidence.
- Workflow Service: no-code workflow definitions, approvals, SLAs, escalations.
- Form Service: dynamic forms, versions, submissions, PDF generation, signatures.
- Performance Service: goals, OKRs, KPIs, review cycles, calibration.
- Learning Service: courses, assessments, certifications, recommendations.
- Asset Service: inventory, allocation, recovery, service history.
- Engagement Service: surveys, pulse, recognition, rewards, announcements.
- Helpdesk Service: tickets, assignment, SLA, escalation.
- AI Service: copilots, ranking, OCR, extraction, predictions.
- Analytics Service: metrics, dashboard builder, exports, BI sync.
- Integration Service: marketplace, connectors, webhooks, data sync.
- Notification Service: email, SMS, push, in-app, Teams, Slack.

## Communication

- Synchronous: REST and GraphQL through API gateway.
- Realtime: WebSockets for approvals, attendance, notifications, collaboration.
- Asynchronous: event bus topics such as `employee.created`, `payroll.run.completed`, `workflow.task.assigned`, and `compliance.filing.due`.
- Search: Elasticsearch indexes employee, candidate, document, ticket, and knowledge data.

