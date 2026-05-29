import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const passwordIterations = 120000;
const passwordKeyLength = 64;
const passwordDigest = 'sha512';
const maxFailedAttempts = 5;
const lockoutMinutes = 15;

/**
 * Creates a PBKDF2 password hash. Production deployments may replace this
 * with bcrypt cost >= 12 through the same service boundary.
 * @param {string} password
 */
export function createPasswordHash(password) {
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, passwordIterations, passwordKeyLength, passwordDigest).toString('hex');
  return `pbkdf2:${passwordIterations}:${salt}:${hash}`;
}

/**
 * @param {string} password
 * @param {string} storedHash
 */
export function verifyPassword(password, storedHash) {
  const [algorithm, iterationsText, salt, expectedHash] = storedHash.split(':');
  if (algorithm !== 'pbkdf2' || salt === undefined || expectedHash === undefined) {
    return false;
  }
  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations < passwordIterations) {
    return false;
  }
  const actualHash = pbkdf2Sync(password, salt, iterations, passwordKeyLength, passwordDigest);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  return actualHash.length === expectedBuffer.length && timingSafeEqual(actualHash, expectedBuffer);
}

/**
 * @param {string} token
 */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * @param {{ failedAttempts: number; lockedUntil?: string | null }} account
 * @param {Date} [now]
 */
export function canAttemptLogin(account, now = new Date()) {
  if (!account.lockedUntil) return true;
  return new Date(account.lockedUntil).getTime() <= now.getTime();
}

/**
 * @param {{ failedAttempts: number; lockedUntil?: string | null }} account
 * @param {Date} [now]
 */
export function registerFailedLogin(account, now = new Date()) {
  const failedAttempts = account.failedAttempts + 1;
  return {
    failedAttempts,
    lockedUntil: failedAttempts >= maxFailedAttempts ? new Date(now.getTime() + lockoutMinutes * 60 * 1000).toISOString() : account.lockedUntil ?? null,
  };
}

export function registerSuccessfulLogin() {
  return {
    failedAttempts: 0,
    lockedUntil: null,
  };
}

/**
 * @param {{ permissions: string[] }} actor
 * @param {string} permission
 */
export function hasPermission(actor, permission) {
  return actor.permissions.includes('*') || actor.permissions.includes(permission);
}

/**
 * @param {{ id: string; employeeId?: string; directReportIds: string[]; permissions: string[] }} actor
 * @param {{ employeeId: string }} resource
 */
export function canAccessEmployeeRecord(actor, resource) {
  if (hasPermission(actor, 'employees:read:all')) return true;
  if (actor.employeeId === resource.employeeId && hasPermission(actor, 'employees:read:self')) return true;
  if (actor.directReportIds.includes(resource.employeeId) && hasPermission(actor, 'employees:read:team')) return true;
  return false;
}

/**
 * @param {{ id: string; revokedAt?: string | null }} session
 * @param {Date} [now]
 */
export function revokeSession(session, now = new Date()) {
  return {
    ...session,
    revokedAt: now.toISOString(),
  };
}
