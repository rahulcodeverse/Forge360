import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

class TooManyRequestsException extends HttpException {
  constructor(msg = 'Too many requests') {
    super(msg, HttpStatus.TOO_MANY_REQUESTS);
  }
}
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';

import type { JwtPayload, Role } from '@hrms/shared-types';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TotpService } from './totp.service';
import { EncryptionService } from '../../common/encryption/encryption.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    private readonly totp: TotpService,
    private readonly encryption: EncryptionService,
    @InjectQueue('notifications') private readonly notifQueue: Queue,
  ) {}

  // ── Credential validation ───────────────────────────────────────────────

  async validateUser(email: string, password: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, tenantId, isActive: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new TooManyRequestsException(
        `Account locked. Try again in ${minutesLeft} minutes.`,
      );
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Please sign in with your SSO provider');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      const newCount = user.failedLoginCount + 1;
      const update: Parameters<typeof this.prisma.user.update>[0]['data'] = {
        failedLoginCount: newCount,
      };
      if (newCount >= MAX_FAILED_ATTEMPTS) {
        update.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        this.logger.warn(`Account locked: ${email}`);
      }
      await this.prisma.user.update({ where: { id: user.id }, data: update });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset on successful password
    if (user.failedLoginCount > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }

    return user;
  }

  // ── Login flow ───────────────────────────────────────────────────────────

  async login(
    userId: string,
    tenantId: string,
    totpCode: string | undefined,
    ip: string | undefined,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { employee: { select: { id: true } } },
    });

    // MFA verification
    if (user.isMfaEnabled) {
      if (!totpCode) {
        return { requiresMfa: true };
      }
      const secret = this.encryption.tryDecrypt(user.totpSecretEncrypted);
      if (!secret || !this.totp.verify(secret, totpCode)) {
        throw new UnauthorizedException('Invalid TOTP code');
      }
    }

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      tenantId,
      role: user.role as Role,
      employeeId: user.employee?.id,
    };

    const accessToken = this.jwt.sign(payload);
    const { refreshToken, jti } = await this.issueRefreshToken(user.id, tenantId);

    // Create session record
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tenantId,
        ipAddress: ip ?? null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip ?? null },
    });

    await this.audit.log({
      tenantId,
      actorId: user.id,
      actorIp: ip,
      module: 'auth',
      action: 'LOGIN',
      entityType: 'user',
      entityId: user.id,
    });

    return {
      requiresMfa: false,
      accessToken,
      refreshToken,
      tenantId,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employee?.id,
      },
    };
  }

  // ── Refresh token ────────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string) {
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    let payload: JwtPayload;

    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { jti: (payload as Record<string, unknown>)['jti'] as string },
    });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    // Rotate — revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      include: { employee: { select: { id: true } } },
    });

    const newPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      tenantId: payload.tenantId,
      role: user.role as Role,
      employeeId: user.employee?.id,
    };

    const newAccessToken = this.jwt.sign(newPayload);
    const { refreshToken: newRefreshToken } = await this.issueRefreshToken(
      user.id,
      payload.tenantId,
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ── Password reset ───────────────────────────────────────────────────────

  async requestPasswordReset(email: string, tenantId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({ where: { email, tenantId } });
    if (!user) return; // Silent — don't reveal user existence

    const token = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(token).digest('hex');

    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Queue email
    await this.notifQueue.add('password-reset-email', {
      userId: user.id,
      email,
      token, // raw token sent in email link
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const reset = await this.prisma.passwordReset.findFirst({
      where: { token: hashedToken, usedAt: null, expiresAt: { gte: new Date() } },
    });

    if (!reset) throw new BadRequestException('Invalid or expired password reset token');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash, passwordChangedAt: new Date(), failedLoginCount: 0, lockedUntil: null },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens for security
      this.prisma.refreshToken.updateMany({
        where: { userId: reset.userId },
        data: { isRevoked: true },
      }),
    ]);
  }

  // ── MFA setup ────────────────────────────────────────────────────────────

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const { secret, otpauthUrl, qrCode } = await this.totp.generateSecret(user.email);

    const encryptedSecret = this.encryption.encrypt(secret);
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecretEncrypted: encryptedSecret },
    });

    return { otpauthUrl, qrCode };
  }

  async confirmMfa(userId: string, totpCode: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = this.encryption.tryDecrypt(user.totpSecretEncrypted);

    if (!secret) throw new BadRequestException('MFA not initialized. Call setup first.');
    if (!this.totp.verify(secret, totpCode)) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isMfaEnabled: true },
    });
  }

  async disableMfa(userId: string, totpCode: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = this.encryption.tryDecrypt(user.totpSecretEncrypted);

    if (!secret || !this.totp.verify(secret, totpCode)) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isMfaEnabled: false, totpSecretEncrypted: null },
    });
  }

  // ── Sessions ─────────────────────────────────────────────────────────────

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, expiresAt: { gte: new Date() } },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { id: sessionId, userId } });
  }

  async logout(userId: string, refreshToken: string, ip: string | undefined): Promise<void> {
    try {
      const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
      const decoded = this.jwt.decode(refreshToken) as { jti?: string };
      if (decoded?.jti) {
        await this.prisma.refreshToken.updateMany({
          where: { jti: decoded.jti, userId },
          data: { isRevoked: true },
        });
      }
    } catch { /* ignore invalid token */ }

    await this.audit.log({
      tenantId: (await this.prisma.user.findUnique({ where: { id: userId } }))!.tenantId,
      actorId: userId,
      actorIp: ip,
      module: 'auth',
      action: 'LOGOUT',
      entityType: 'user',
      entityId: userId,
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private async issueRefreshToken(userId: string, tenantId: string) {
    const jti = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');

    const refreshToken = this.jwt.sign(
      { sub: userId, tenantId, jti },
      { secret: refreshSecret, expiresIn: '30d' },
    );

    await this.prisma.refreshToken.create({
      data: { userId, tenantId, jti, expiresAt },
    });

    return { refreshToken, jti };
  }
}
