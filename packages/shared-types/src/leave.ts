import { z } from 'zod';

import { approvalStatusSchema, dateStringSchema, uuidSchema } from './common';

export const leaveTypeSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  code: z.string(),
  isPaid: z.boolean(),
  carryForwardLimit: z.number().nullable(),
  encashable: z.boolean(),
  genderRestricted: z.enum(['male', 'female']).nullable(),
  allowHalfDay: z.boolean().default(true),
  requiresAttachment: z.boolean().default(false),
  minAdvanceNoticeDays: z.number().default(0),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export type LeaveType = z.infer<typeof leaveTypeSchema>;

export const leaveAccrualFrequencySchema = z.enum(['monthly', 'quarterly', 'annual', 'once']);
export type LeaveAccrualFrequency = z.infer<typeof leaveAccrualFrequencySchema>;

export const leaveCarryForwardRuleSchema = z.enum([
  'unlimited',
  'capped',
  'none',
  'lapsing',
]);
export type LeaveCarryForwardRule = z.infer<typeof leaveCarryForwardRuleSchema>;

export const leavePolicySchema = z.object({
  id: uuidSchema,
  gradeId: uuidSchema,
  leaveTypeId: uuidSchema,
  accrualFrequency: leaveAccrualFrequencySchema,
  accrualAmount: z.number().positive(),
  maxBalance: z.number().positive().nullable(),
  carryForwardRule: leaveCarryForwardRuleSchema,
  carryForwardCap: z.number().nonnegative().nullable(),
  proRataOnJoining: z.boolean().default(true),
});

export type LeavePolicy = z.infer<typeof leavePolicySchema>;

export const leaveBalanceSchema = z.object({
  leaveTypeId: uuidSchema,
  leaveTypeName: z.string(),
  year: z.number(),
  opening: z.number(),
  accrued: z.number(),
  taken: z.number(),
  pending: z.number(),
  closing: z.number(),
  available: z.number(),
});

export type LeaveBalance = z.infer<typeof leaveBalanceSchema>;

export const createLeaveRequestSchema = z
  .object({
    leaveTypeId: uuidSchema,
    fromDate: z.string().date(),
    toDate: z.string().date(),
    isHalfDay: z.boolean().default(false),
    halfDayType: z.enum(['first_half', 'second_half']).optional(),
    reason: z.string().min(5).max(1000),
    attachmentUrl: z.string().url().optional(),
  })
  .refine((d) => d.fromDate <= d.toDate, {
    message: 'From date must be before or equal to to date',
    path: ['toDate'],
  })
  .refine((d) => !d.isHalfDay || !!d.halfDayType, {
    message: 'Half day type is required for half day leaves',
    path: ['halfDayType'],
  });

export type CreateLeaveRequestDto = z.infer<typeof createLeaveRequestSchema>;

export const leaveRequestResponseSchema = z.object({
  id: uuidSchema,
  employeeId: uuidSchema,
  leaveType: z.object({ id: uuidSchema, name: z.string(), code: z.string() }),
  fromDate: z.string(),
  toDate: z.string(),
  durationDays: z.number(),
  isHalfDay: z.boolean(),
  halfDayType: z.string().nullable(),
  reason: z.string(),
  attachmentUrl: z.string().nullable(),
  status: approvalStatusSchema,
  currentLevel: z.number(),
  approverChain: z.array(
    z.object({
      level: z.number(),
      approverType: z.string(),
      approverId: uuidSchema.nullable(),
      approverName: z.string().nullable(),
      decision: z.enum(['pending', 'approved', 'rejected']),
      decidedAt: dateStringSchema.nullable(),
      comment: z.string().nullable(),
    }),
  ),
  cancelledAt: dateStringSchema.nullable(),
  createdAt: dateStringSchema,
});

export type LeaveRequestResponse = z.infer<typeof leaveRequestResponseSchema>;

export const approveLeaveSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  comment: z.string().max(1000).optional(),
});

export type ApproveLeaveDto = z.infer<typeof approveLeaveSchema>;

export const holidaySchema = z.object({
  id: uuidSchema,
  name: z.string(),
  date: z.string().date(),
  isOptional: z.boolean(),
  locationIds: z.array(uuidSchema),
  calendarId: uuidSchema,
});

export type Holiday = z.infer<typeof holidaySchema>;
