import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  cursor: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
    }),
  });

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z.record(z.unknown()).optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().optional(),
      })
      .optional(),
  });

export const dateStringSchema = z.string().datetime({ offset: true });

export const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{6,14}$/, 'Must be E.164 format, e.g. +919876543210');

export const currencySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().length(3),
});

export type Currency = z.infer<typeof currencySchema>;

export const countryCodeSchema = z.enum([
  'IN', // India
  'US', // United States
  'GB', // United Kingdom
  'AE', // UAE
  'SA', // Saudi Arabia
  'AU', // Australia
  'DE', // Germany
  'FR', // France
  'SG', // Singapore
]);

export type CountryCode = z.infer<typeof countryCodeSchema>;

export const employmentTypeSchema = z.enum(['full_time', 'part_time', 'contract', 'intern']);
export type EmploymentType = z.infer<typeof employmentTypeSchema>;

export const employmentStatusSchema = z.enum([
  'active',
  'on_leave',
  'suspended',
  'terminated',
  'probation',
]);
export type EmploymentStatus = z.infer<typeof employmentStatusSchema>;

export const genderSchema = z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']);
export type Gender = z.infer<typeof genderSchema>;

export const approvalStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'revoked',
]);
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
