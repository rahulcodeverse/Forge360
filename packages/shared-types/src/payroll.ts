import { z } from 'zod';

import { uuidSchema, dateStringSchema, countryCodeSchema } from './common';

export const payrollComponentTypeSchema = z.enum(['earning', 'deduction', 'statutory']);
export type PayrollComponentType = z.infer<typeof payrollComponentTypeSchema>;

export const payrollCalculationTypeSchema = z.enum(['fixed', 'percentage', 'formula']);
export type PayrollCalculationType = z.infer<typeof payrollCalculationTypeSchema>;

export const payrollRunStatusSchema = z.enum([
  'draft',
  'processing',
  'processed',
  'approved',
  'paid',
  'failed',
]);
export type PayrollRunStatus = z.infer<typeof payrollRunStatusSchema>;

export const taxRegimeSchema = z.enum(['old', 'new']);
export type TaxRegime = z.infer<typeof taxRegimeSchema>;

export const payrollComponentSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  code: z.string().regex(/^[A-Z_]+$/, 'Component code must be uppercase letters and underscores'),
  type: payrollComponentTypeSchema,
  calculationType: payrollCalculationTypeSchema,
  isTaxable: z.boolean(),
  formulaExpression: z.string().nullable(),
  fixedAmount: z.number().nullable(),
  percentageBase: z.string().nullable(),
  percentageValue: z.number().nullable(),
  order: z.number(),
  isActive: z.boolean(),
});

export type PayrollComponent = z.infer<typeof payrollComponentSchema>;

export const salaryStructureSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  applicableGrades: z.array(uuidSchema),
  components: z.array(
    z.object({
      componentId: uuidSchema,
      order: z.number(),
      overridable: z.boolean(),
    }),
  ),
  isActive: z.boolean(),
});

export type SalaryStructure = z.infer<typeof salaryStructureSchema>;

export const runPayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  locationIds: z.array(uuidSchema).optional(),
  employeeIds: z.array(uuidSchema).optional(),
});

export type RunPayrollDto = z.infer<typeof runPayrollSchema>;

export const payrollRunSchema = z.object({
  id: uuidSchema,
  tenantId: uuidSchema,
  month: z.number(),
  year: z.number(),
  status: payrollRunStatusSchema,
  triggeredBy: uuidSchema,
  triggeredAt: dateStringSchema,
  processedAt: dateStringSchema.nullable(),
  approvedBy: uuidSchema.nullable(),
  approvedAt: dateStringSchema.nullable(),
  paidAt: dateStringSchema.nullable(),
  totalGross: z.number(),
  totalDeductions: z.number(),
  totalNet: z.number(),
  employeeCount: z.number(),
  errors: z.array(z.string()).nullable(),
});

export type PayrollRun = z.infer<typeof payrollRunSchema>;

export const payslipSchema = z.object({
  runItemId: uuidSchema,
  employee: z.object({
    id: uuidSchema,
    code: z.string(),
    fullName: z.string(),
    designation: z.string(),
    department: z.string(),
    location: z.string(),
    pan: z.string().nullable(),
    bankAccount: z.string().nullable(),
    bankName: z.string().nullable(),
    ifsc: z.string().nullable(),
  }),
  period: z.object({
    month: z.number(),
    year: z.number(),
    workingDays: z.number(),
    presentDays: z.number(),
    lopDays: z.number(),
  }),
  earnings: z.array(z.object({ code: z.string(), name: z.string(), amount: z.number() })),
  deductions: z.array(z.object({ code: z.string(), name: z.string(), amount: z.number() })),
  statutory: z.array(z.object({ code: z.string(), name: z.string(), amount: z.number() })),
  gross: z.number(),
  totalDeductions: z.number(),
  tds: z.number(),
  netPay: z.number(),
  ytdGross: z.number(),
  ytdTax: z.number(),
  payslipUrl: z.string().nullable(),
});

export type Payslip = z.infer<typeof payslipSchema>;

export const taxDeclarationSchema = z.object({
  regime: taxRegimeSchema,
  investments: z.object({
    section80C: z.number().nonnegative().max(150000),
    section80D: z.number().nonnegative().max(100000),
    hra: z.number().nonnegative(),
    lta: z.number().nonnegative(),
    nps: z.number().nonnegative().max(50000),
    otherDeductions: z.number().nonnegative(),
  }),
  proofsSubmitted: z.boolean(),
});

export type TaxDeclarationDto = z.infer<typeof taxDeclarationSchema>;
