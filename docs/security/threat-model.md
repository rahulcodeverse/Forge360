# Threat Model

Primary risks:

- Tenant data leakage.
- Payroll or bank-detail exposure.
- Privilege escalation through RBAC misconfiguration.
- Malicious file upload.
- Stolen refresh tokens.
- Audit log tampering.

Controls:

- Schema-per-tenant isolation.
- Encrypted PII and salary fields.
- Redis token denylist and refresh-token rotation.
- File magic-byte validation and virus scanning.
- Append-only audit log permissions.
- SAST, dependency scanning, secrets scanning, and ASVS checklist in CI.

