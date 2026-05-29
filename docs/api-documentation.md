# API Documentation

## REST API

Base path: `/api/v1`

- `GET /health`
- `GET /workforce/suite`
- `GET /workforce/modules`
- `POST /auth/email/login`
- `POST /auth/mobile/otp`
- `GET /auth/oauth/:provider`
- `POST /tenants`
- `GET /employees`
- `POST /employees`
- `GET /employees/:id`
- `PATCH /employees/:id`
- `GET /organization/units`
- `GET /organization/org-chart`
- `POST /custom-fields`
- `POST /jobs`
- `POST /candidates`
- `POST /leave-requests`
- `POST /attendance/check-in`
- `POST /payroll/runs`
- `POST /rules`
- `POST /rules/evaluate`
- `GET /platform/capabilities`
- `GET /platform/security`
- `GET /platform/analytics`
- `GET /platform/ai`
- `POST /workflows`
- `POST /forms`
- `POST /ai/copilot/messages`

## GraphQL

GraphQL is used for complex admin consoles, analytics dashboards, org charts, and employee profile composition.

Core query examples:

```graphql
query EmployeeProfile($id: ID!) {
  employee(id: $id) {
    id
    displayName
    department { name }
    manager { displayName }
    customFields { key value }
  }
}
```

## Swagger

Swagger UI is exposed at `/api/docs` by the NestJS API bootstrap.

## API Standards

- All requests include tenant context.
- All mutations are audit logged.
- Sensitive fields are permission filtered.
- Idempotency keys are required for payroll, workflow, and integration write APIs.
- Webhooks are signed and replay protected.
