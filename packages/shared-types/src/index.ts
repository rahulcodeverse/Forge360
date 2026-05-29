import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const employmentTypeSchema = z.enum(['full_time', 'part_time', 'contract', 'intern']);
export const employmentStatusSchema = z.enum(['active', 'on_leave', 'suspended', 'terminated']);

export const employeeSchema = z.object({
  id: uuidSchema,
  employeeCode: z.string().min(1),
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  workEmail: z.string().email(),
  personalEmail: z.string().email(),
  joiningDate: z.string(),
  employmentType: employmentTypeSchema,
  employmentStatus: employmentStatusSchema,
  departmentId: uuidSchema,
  designationId: uuidSchema,
  gradeId: uuidSchema,
  locationId: uuidSchema,
  costCenterId: uuidSchema,
  reportingManagerId: uuidSchema.optional(),
  dottedLineManagerId: uuidSchema.optional(),
});

export const leaveRequestCreateSchema = z.object({
  employeeId: uuidSchema,
  leaveTypeId: uuidSchema,
  fromDate: z.string(),
  toDate: z.string(),
  durationDays: z.number().positive(),
  reason: z.string().min(2),
});

export const payrollRunCreateSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  triggeredBy: uuidSchema,
});

export type EmployeeDto = z.infer<typeof employeeSchema>;
export type LeaveRequestCreateDto = z.infer<typeof leaveRequestCreateSchema>;
export type PayrollRunCreateDto = z.infer<typeof payrollRunCreateSchema>;

export interface ApiEnvelope<T> {
  data: T;
  meta?: {
    page?: number;
    total?: number;
    limit?: number;
    cursor?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

