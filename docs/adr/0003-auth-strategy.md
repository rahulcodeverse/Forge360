# ADR 0003 — Auth Strategy: JWT + Refresh Tokens + MFA + SAML

**Status**: Accepted  
**Date**: 2026-05-29

## Decision

- **JWT access tokens** (15-minute expiry, signed with HS256) stored in `sessionStorage`.
- **Refresh tokens** (30-day expiry) stored in Redis, delivered as `httpOnly` cookies. Token rotation: each refresh issues a new refresh token and invalidates the old one (stored as `jti` in a Redis set).
- **MFA via TOTP** (RFC 6238, otplib library). TOTP secrets stored encrypted (AES-256) in the DB; never returned to the client.
- **Account lockout**: 5 failed attempts trigger a 15-minute lockout stored as a Redis counter with TTL.
- **SAML 2.0** via `passport-saml` for enterprise customers with Okta/Azure AD/Google Workspace IdPs.
- **OAuth2/OIDC** via `passport-google-oauth20` and `passport-microsoft`.
- **RBAC**: 5 built-in roles (super_admin, hr_admin, hr_manager, manager, employee) + custom tenant roles stored in DB. `RolesGuard` enforces role requirements on controllers; `TenantGuard` enforces tenant isolation.

## Consequences

- No server-side session state (Redis only stores refresh token allowlist and rate-limit counters).
- SAML metadata endpoint at `/api/v1/auth/saml/metadata` auto-generates SP metadata for IdP configuration.
- Password reset uses time-limited tokens (24h) stored in Redis, not in the DB.
