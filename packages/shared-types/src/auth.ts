import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantSlug: z.string().min(1, 'Workspace is required'),
  totpCode: z.string().length(6).optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain uppercase, lowercase, number and special character',
    ),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  tenantId: z.string().uuid(),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});

export const passwordResetSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z
      .string()
      .min(8)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const totpSetupSchema = z.object({
  totpCode: z.string().length(6),
});

export const roleSchema = z.enum([
  'super_admin',
  'hr_admin',
  'hr_manager',
  'manager',
  'employee',
]);

export type Role = z.infer<typeof roleSchema>;

export const permissionSchema = z.object({
  module: z.string(),
  actions: z.array(z.enum(['read', 'create', 'update', 'delete', 'approve', 'export'])),
});

export type Permission = z.infer<typeof permissionSchema>;

export const jwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  tenantId: z.string().uuid(),
  role: roleSchema,
  employeeId: z.string().uuid().optional(),
  iat: z.number(),
  exp: z.number(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
