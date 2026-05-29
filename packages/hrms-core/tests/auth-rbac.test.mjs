import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAccessEmployeeRecord,
  canAttemptLogin,
  createPasswordHash,
  hashToken,
  hasPermission,
  registerFailedLogin,
  registerSuccessfulLogin,
  revokeSession,
  verifyPassword,
} from '../src/index.mjs';

test('password hashes verify without storing the clear text password', () => {
  const hash = createPasswordHash('CorrectHorseBatteryStaple!');
  assert.notEqual(hash.includes('CorrectHorseBatteryStaple!'), true);
  assert.equal(verifyPassword('CorrectHorseBatteryStaple!', hash), true);
  assert.equal(verifyPassword('wrong-password', hash), false);
});

test('failed login locks account after five attempts and success resets lockout state', () => {
  const now = new Date('2026-05-29T00:00:00.000Z');
  let account = { failedAttempts: 0, lockedUntil: null };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    account = registerFailedLogin(account, now);
  }
  assert.equal(account.failedAttempts, 5);
  assert.equal(canAttemptLogin(account, new Date('2026-05-29T00:10:00.000Z')), false);
  assert.equal(canAttemptLogin(account, new Date('2026-05-29T00:16:00.000Z')), true);
  assert.deepEqual(registerSuccessfulLogin(), { failedAttempts: 0, lockedUntil: null });
});

test('RBAC data scopes distinguish self, team, and HR-wide access', () => {
  const employee = { id: 'u1', employeeId: 'emp-1', directReportIds: [], permissions: ['employees:read:self'] };
  const manager = { id: 'u2', employeeId: 'emp-2', directReportIds: ['emp-1'], permissions: ['employees:read:self', 'employees:read:team'] };
  const hr = { id: 'u3', employeeId: 'emp-3', directReportIds: [], permissions: ['employees:read:all'] };
  assert.equal(canAccessEmployeeRecord(employee, { employeeId: 'emp-1' }), true);
  assert.equal(canAccessEmployeeRecord(employee, { employeeId: 'emp-2' }), false);
  assert.equal(canAccessEmployeeRecord(manager, { employeeId: 'emp-1' }), true);
  assert.equal(canAccessEmployeeRecord(hr, { employeeId: 'emp-9' }), true);
  assert.equal(hasPermission({ permissions: ['*'] }, 'payroll:run'), true);
});

test('tokens are hashed and sessions can be revoked immutably by timestamp', () => {
  const tokenHash = hashToken('refresh-token-value');
  assert.equal(tokenHash.length, 64);
  assert.notEqual(tokenHash, 'refresh-token-value');
  const revoked = revokeSession({ id: 'session-1' }, new Date('2026-05-29T01:00:00.000Z'));
  assert.equal(revoked.revokedAt, '2026-05-29T01:00:00.000Z');
});
