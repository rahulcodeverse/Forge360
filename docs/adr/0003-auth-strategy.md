# ADR 0003: Auth Strategy

## Decision

Use short-lived JWT access tokens, Redis-backed refresh tokens, MFA via TOTP, SAML2 for enterprise SSO, OAuth2/OIDC for Google and Microsoft, and DB-backed RBAC.

## Rationale

This supports SMB login simplicity and enterprise identity requirements without changing authorization enforcement.

