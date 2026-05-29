import { z } from 'zod';

import { approvalStatusSchema, dateStringSchema, uuidSchema } from './common';

export const clockInSourceSchema = z.enum(['web', 'mobile', 'biometric', 'manual']);
export type ClockInSource = z.infer<typeof clockInSourceSchema>;

export const attendanceStatusSchema = z.enum([
  'present',
  'absent',
  'half_day',
  'weekend',
  'holiday',
  'on_leave',
  'work_from_home',
]);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const clockInSchema = z.object({
  timestamp: z.string().datetime({ offset: true }).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  ipAddress: z.string().ip().optional(),
  source: clockInSourceSchema.default('web'),
  note: z.string().max(500).optional(),
});

export type ClockInDto = z.infer<typeof clockInSchema>;

export const clockOutSchema = z.object({
  timestamp: z.string().datetime({ offset: true }).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  note: z.string().max(500).optional(),
});

export type ClockOutDto = z.infer<typeof clockOutSchema>;

export const attendanceRecordSchema = z.object({
  id: uuidSchema,
  employeeId: uuidSchema,
  date: z.string().date(),
  clockIn: dateStringSchema.nullable(),
  clockOut: dateStringSchema.nullable(),
  clockInSource: clockInSourceSchema.nullable(),
  totalHours: z.number().nullable(),
  overtimeHours: z.number().nullable(),
  status: attendanceStatusSchema,
  isLate: z.boolean(),
  lateByMinutes: z.number().nullable(),
  isEarlyLeave: z.boolean(),
  approvedBy: uuidSchema.nullable(),
  approvedAt: dateStringSchema.nullable(),
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

export const regularizationRequestSchema = z.object({
  employeeId: uuidSchema,
  date: z.string().date(),
  requestedClockIn: z.string().datetime({ offset: true }).optional(),
  requestedClockOut: z.string().datetime({ offset: true }).optional(),
  reason: z.string().min(10).max(1000),
  attachmentUrl: z.string().url().optional(),
});

export type RegularizationRequestDto = z.infer<typeof regularizationRequestSchema>;

export const shiftSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be HH:MM format'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  breakDurationMinutes: z.number().nonnegative(),
  isNightShift: z.boolean(),
  gracePeriodMinutes: z.number().nonnegative().default(0),
  overtimeThresholdMinutes: z.number().nonnegative().default(0),
});

export type Shift = z.infer<typeof shiftSchema>;

export const shiftAssignmentSchema = z.object({
  employeeId: uuidSchema,
  shiftId: uuidSchema,
  effectiveFrom: z.string().date(),
  effectiveTo: z.string().date().optional(),
});

export type ShiftAssignmentDto = z.infer<typeof shiftAssignmentSchema>;

export const liveAttendanceSummarySchema = z.object({
  date: z.string().date(),
  totalEmployees: z.number(),
  present: z.number(),
  absent: z.number(),
  late: z.number(),
  onLeave: z.number(),
  workFromHome: z.number(),
  notMarked: z.number(),
  updatedAt: dateStringSchema,
});

export type LiveAttendanceSummary = z.infer<typeof liveAttendanceSummarySchema>;
