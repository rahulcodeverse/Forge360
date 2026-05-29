import { getQueueToken } from '@nestjs/bull';
import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';

import { EncryptionService } from '../../common/encryption/encryption.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';
import { TotpService } from './totp.service';

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  session: { create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  passwordReset: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

const mockJwt = {
  sign: jest.fn(() => 'mock-access-token'),
  verify: jest.fn(),
  decode: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    const values: Record<string, string> = {
      JWT_ACCESS_SECRET: 'test-secret-min-32-chars-long-value',
      JWT_REFRESH_SECRET: 'refresh-secret-min-32-chars-long!!',
    };
    return values[key] ?? '';
  }),
  get: jest.fn(),
};

const mockAudit = { log: jest.fn() };
const mockTotp = { generateSecret: jest.fn(), verify: jest.fn() };
const mockEncryption = { encrypt: jest.fn(), tryDecrypt: jest.fn(), decrypt: jest.fn() };
const mockQueue = { add: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: AuditService, useValue: mockAudit },
        { provide: TotpService, useValue: mockTotp },
        { provide: EncryptionService, useValue: mockEncryption },
        { provide: getQueueToken('notifications'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      tenantId: 'tenant-id',
      passwordHash: null as string | null,
      failedLoginCount: 0,
      lockedUntil: null as Date | null,
      isActive: true,
    };

    it('throws UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.validateUser('bad@email.com', 'pass', 'tenant')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws TooManyRequestsException for locked account', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 60000),
      });
      await expect(
        service.validateUser('test@example.com', 'pass', 'tenant-id'),
      ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    });

    it('throws UnauthorizedException for SSO-only user', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, passwordHash: null });
      await expect(service.validateUser('test@example.com', 'pass', 'tenant-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correct-pass', 10);
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, passwordHash: hash });
      mockPrisma.user.update.mockResolvedValue({});

      await expect(
        service.validateUser('test@example.com', 'wrong-pass', 'tenant-id'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns user on valid credentials', async () => {
      const hash = await bcrypt.hash('correct-pass', 10);
      mockPrisma.user.findFirst.mockResolvedValue({ ...mockUser, passwordHash: hash });

      const result = await service.validateUser('test@example.com', 'correct-pass', 'tenant-id');
      expect(result).toMatchObject({ email: 'test@example.com' });
    });

    it('locks account after 5 failed attempts', async () => {
      const hash = await bcrypt.hash('correct', 10);
      mockPrisma.user.findFirst.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
        failedLoginCount: 4,
      });
      mockPrisma.user.update.mockResolvedValue({});

      try {
        await service.validateUser('test@example.com', 'wrong', 'tenant-id');
      } catch {
        // expected
      }

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lockedUntil: expect.any(Date) }),
        }),
      );
    });
  });

  describe('login', () => {
    it('returns requiresMfa: true when MFA enabled and no TOTP code provided', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        role: 'employee',
        isMfaEnabled: true,
        totpSecretEncrypted: 'encrypted',
        employee: null,
      });

      const result = await service.login('user-id', 'tenant-id', undefined, '127.0.0.1');
      expect(result).toEqual({ requiresMfa: true });
    });

    it('returns tokens when MFA not enabled', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        tenantId: 'tenant-id',
        role: 'employee',
        isMfaEnabled: false,
        employee: { id: 'emp-id' },
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.session.create.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockAudit.log.mockResolvedValue(undefined);

      const result = await service.login('user-id', 'tenant-id', undefined, '127.0.0.1');
      expect(result).toMatchObject({
        requiresMfa: false,
        accessToken: 'mock-access-token',
        tenantId: 'tenant-id',
      });
    });
  });

  describe('TotpService', () => {
    let totpService: TotpService;

    beforeEach(async () => {
      const module = await Test.createTestingModule({
        providers: [TotpService],
      }).compile();
      totpService = module.get<TotpService>(TotpService);
    });

    it('generates a secret and QR code', async () => {
      const result = await totpService.generateSecret('test@example.com');
      expect(result.secret).toBeDefined();
      expect(result.otpauthUrl).toContain('otpauth://totp/');
      expect(result.qrCode).toContain('data:image/png;base64,');
    });

    it('verifies a valid TOTP code', async () => {
      const { secret } = await totpService.generateSecret('test@example.com');
      const { authenticator } = await import('otplib');
      const validCode = authenticator.generate(secret);
      expect(totpService.verify(secret, validCode)).toBe(true);
    });

    it('rejects an invalid TOTP code', async () => {
      const { secret } = await totpService.generateSecret('test@example.com');
      expect(totpService.verify(secret, '000000')).toBe(false);
    });
  });
});
