import { z } from 'zod';

import {
  dateStringSchema,
  employmentStatusSchema,
  employmentTypeSchema,
  genderSchema,
  phoneSchema,
  uuidSchema,
} from './common';

export const emergencyContactSchema = z.object({
  name: z.string().min(1).max(200),
  relationship: z.string().min(1).max(100),
  phone: phoneSchema,
  email: z.string().email().optional(),
});

export const addressSchema = z.object({
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().length(2),
  postalCode: z.string().min(1).max(20),
});

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().date(),
  gender: genderSchema,
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  nationality: z.string().length(2).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  personalEmail: z.string().email().optional(),
  workEmail: z.string().email(),
  phone: phoneSchema,
  emergencyContact: emergencyContactSchema.optional(),
  joiningDate: z.string().date(),
  probationEndDate: z.string().date().optional(),
  employmentType: employmentTypeSchema,
  employmentStatus: employmentStatusSchema.default('probation'),
  departmentId: uuidSchema,
  designationId: uuidSchema,
  gradeId: uuidSchema,
  locationId: uuidSchema,
  costCenterId: uuidSchema.optional(),
  reportingManagerId: uuidSchema.optional(),
  dottedLineManagerId: uuidSchema.optional(),
  currentAddress: addressSchema.optional(),
  permanentAddress: addressSchema.optional(),
});

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial();
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;

export const employeeResponseSchema = z.object({
  id: uuidSchema,
  employeeCode: z.string(),
  firstName: z.string(),
  middleName: z.string().nullable(),
  lastName: z.string(),
  fullName: z.string(),
  dateOfBirth: z.string().nullable(),
  gender: genderSchema.nullable(),
  maritalStatus: z.string().nullable(),
  nationality: z.string().nullable(),
  bloodGroup: z.string().nullable(),
  personalEmail: z.string().nullable(),
  workEmail: z.string(),
  phone: z.string().nullable(),
  profilePhotoUrl: z.string().nullable(),
  joiningDate: z.string(),
  confirmationDate: z.string().nullable(),
  probationEndDate: z.string().nullable(),
  employmentType: employmentTypeSchema,
  employmentStatus: employmentStatusSchema,
  department: z.object({ id: uuidSchema, name: z.string() }).nullable(),
  designation: z.object({ id: uuidSchema, name: z.string() }).nullable(),
  grade: z.object({ id: uuidSchema, name: z.string() }).nullable(),
  location: z.object({ id: uuidSchema, name: z.string(), country: z.string() }).nullable(),
  reportingManager: z
    .object({ id: uuidSchema, fullName: z.string(), employeeCode: z.string() })
    .nullable(),
  createdAt: dateStringSchema,
  updatedAt: dateStringSchema,
});

export type EmployeeResponse = z.infer<typeof employeeResponseSchema>;

export const departmentSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  code: z.string().optional(),
  parentId: uuidSchema.nullable(),
  headId: uuidSchema.nullable(),
  employeeCount: z.number().optional(),
});

export type Department = z.infer<typeof departmentSchema>;

export const designationSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  code: z.string().optional(),
  gradeId: uuidSchema.nullable(),
  level: z.number().optional(),
});

export type Designation = z.infer<typeof designationSchema>;

export const bulkImportRowSchema = z.object({
  rowNumber: z.number(),
  data: z.record(z.unknown()),
  errors: z.array(z.string()).optional(),
  isValid: z.boolean(),
});

export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;

export const bulkImportResultSchema = z.object({
  total: z.number(),
  valid: z.number(),
  invalid: z.number(),
  rows: z.array(bulkImportRowSchema),
});

export type BulkImportResult = z.infer<typeof bulkImportResultSchema>;
