import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

interface DemoUser {
  id: string;
  tenantId: string;
  employeeId: string;
  email: string;
  passwordHash: string;
  failedAttempts: number;
  lockedUntil: string | null;
  roles: string[];
  permissions: string[];
}

interface DemoSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  revokedAt: string | null;
}

@Injectable()
export class AuthService {
  private readonly users: DemoUser[] = [
    {
      id: 'user_hr_admin',
      tenantId: 'acme',
      employeeId: 'emp_hr',
      email: 'hr.admin@acme.example',
      passwordHash: createPasswordHash('AcmeAdmin123!'),
      failedAttempts: 0,
      lockedUntil: null,
      roles: ['HR Admin'],
      permissions: ['employees:read:all', 'employees:write', 'leave:approve', 'payroll:run', 'payroll:approve'],
    },
    {
      id: 'user_manager',
      tenantId: 'acme',
      employeeId: 'emp_manager',
      email: 'manager@acme.example',
      passwordHash: createPasswordHash('AcmeManager123!'),
      failedAttempts: 0,
      lockedUntil: null,
      roles: ['Manager'],
      permissions: ['employees:read:self', 'employees:read:team', 'leave:approve'],
    },
    {
      id: 'user_employee',
      tenantId: 'acme',
      employeeId: 'emp_employee',
      email: 'employee@acme.example',
      passwordHash: createPasswordHash('AcmeEmployee123!'),
      failedAttempts: 0,
      lockedUntil: null,
      roles: ['Employee'],
      permissions: ['employees:read:self', 'leave:apply', 'attendance:clock'],
    },
  ];

  private readonly sessions: DemoSession[] = [];

  login(input: { email: string; password: string; tenantId: string }) {
    const user = this.users.find((candidate) => candidate.email === input.email && candidate.tenantId === input.tenantId);
    if (!user || !canAttemptLogin(user)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!verifyPassword(input.password, user.passwordHash)) {
      const next = registerFailedLogin(user);
      user.failedAttempts = next.failedAttempts;
      user.lockedUntil = next.lockedUntil;
      throw new UnauthorizedException('Invalid credentials');
    }

    const success = registerSuccessfulLogin();
    user.failedAttempts = success.failedAttempts;
    user.lockedUntil = success.lockedUntil;

    const accessToken = this.issueToken('access', user.id);
    const refreshToken = this.issueToken('refresh', user.id);
    const session: DemoSession = {
      id: `session_${this.sessions.length + 1}`,
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null,
    };
    this.sessions.push(session);

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: 900,
      sessionId: session.id,
      user: this.safeUser(user),
    };
  }

  refresh(input: { refreshToken: string }) {
    const refreshTokenHash = hashToken(input.refreshToken);
    const session = this.sessions.find((candidate) => candidate.refreshTokenHash === refreshTokenHash && candidate.revokedAt === null);
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return {
      accessToken: this.issueToken('access', session.userId),
      expiresInSeconds: 900,
    };
  }

  revoke(input: { sessionId: string }) {
    const session = this.sessions.find((candidate) => candidate.id === input.sessionId);
    if (!session) {
      return { revoked: false };
    }
    session.revokedAt = new Date().toISOString();
    return { revoked: true, sessionId: session.id, revokedAt: session.revokedAt };
  }

  me(input: { tenantId: string }) {
    return {
      tenantId: input.tenantId,
      demoUsers: this.users.map((user) => this.safeUser(user)),
    };
  }

  private safeUser(user: DemoUser) {
    return {
      id: user.id,
      tenantId: user.tenantId,
      employeeId: user.employeeId,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };
  }

  private issueToken(type: 'access' | 'refresh', userId: string): string {
    return `${type}.${userId}.${crypto.randomUUID()}`;
  }
}

const passwordIterations = 120000;
const passwordKeyLength = 64;
const passwordDigest = 'sha512';

function createPasswordHash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, passwordIterations, passwordKeyLength, passwordDigest).toString('hex');
  return `pbkdf2:${passwordIterations}:${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, iterationsText, salt, expectedHash] = storedHash.split(':');
  if (algorithm !== 'pbkdf2' || salt === undefined || expectedHash === undefined) return false;
  const iterations = Number(iterationsText);
  const actualHash = pbkdf2Sync(password, salt, iterations, passwordKeyLength, passwordDigest);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  return actualHash.length === expectedBuffer.length && timingSafeEqual(actualHash, expectedBuffer);
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function canAttemptLogin(account: { lockedUntil: string | null }): boolean {
  return account.lockedUntil === null || new Date(account.lockedUntil).getTime() <= Date.now();
}

function registerFailedLogin(account: { failedAttempts: number; lockedUntil: string | null }): { failedAttempts: number; lockedUntil: string | null } {
  const failedAttempts = account.failedAttempts + 1;
  return {
    failedAttempts,
    lockedUntil: failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : account.lockedUntil,
  };
}

function registerSuccessfulLogin(): { failedAttempts: number; lockedUntil: null } {
  return { failedAttempts: 0, lockedUntil: null };
}
