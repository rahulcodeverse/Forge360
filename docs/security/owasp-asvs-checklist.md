# OWASP ASVS Level 2 Checklist

- Authentication: MFA, lockout, password reset expiry, session revocation.
- Current auth slice implements password hashing, failed-login lockout, refresh-token hashing, safe profile responses, and session revocation. JWT signing, httpOnly refresh cookies, MFA TOTP storage, and SSO adapters are the next implementation step.
- Access control: RBAC, ABAC, manager visibility boundaries, tenant schema isolation.
- Validation: DTO validation, Zod shared schemas, Prisma parameterized queries.
- Cryptography: AES-256 for PII, KMS-managed keys, TLS 1.2+.
- Logging: immutable audit logs for all create/update/delete actions.
- File security: type validation, size limits, ClamAV scan before storage.
