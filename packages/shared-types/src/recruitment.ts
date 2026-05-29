import { z } from 'zod';

import { dateStringSchema, uuidSchema } from './common';

export const jobRequisitionStatusSchema = z.enum([
  'draft',
  'pending_approval',
  'approved',
  'posted',
  'on_hold',
  'closed',
  'cancelled',
]);
export type JobRequisitionStatus = z.infer<typeof jobRequisitionStatusSchema>;

export const applicationStageSchema = z.enum([
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
]);
export type ApplicationStage = z.infer<typeof applicationStageSchema>;

export const interviewTypeSchema = z.enum(['phone', 'video', 'onsite', 'assignment', 'hr']);
export type InterviewType = z.infer<typeof interviewTypeSchema>;

export const createJobRequisitionSchema = z.object({
  title: z.string().min(3).max(200),
  departmentId: uuidSchema,
  gradeId: uuidSchema,
  locationId: uuidSchema,
  vacancies: z.number().int().positive(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
  jdContent: z.string().min(50).max(10000),
  skills: z.array(z.string()),
  minExperienceYears: z.number().nonnegative(),
  maxExperienceYears: z.number().nonnegative().optional(),
  minCtcLakh: z.number().nonnegative().optional(),
  maxCtcLakh: z.number().nonnegative().optional(),
  targetDate: z.string().date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export type CreateJobRequisitionDto = z.infer<typeof createJobRequisitionSchema>;

export const candidateSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  resumeUrl: z.string().nullable(),
  source: z.enum([
    'careers_page',
    'linkedin',
    'naukri',
    'referral',
    'agency',
    'walk_in',
    'other',
  ]),
  currentCtcLakh: z.number().nullable(),
  expectedCtcLakh: z.number().nullable(),
  noticePeriodDays: z.number().nullable(),
  currentLocation: z.string().nullable(),
  skills: z.array(z.string()),
  createdAt: dateStringSchema,
});

export type Candidate = z.infer<typeof candidateSchema>;

export const scheduleInterviewSchema = z.object({
  applicationId: uuidSchema,
  roundNumber: z.number().int().positive(),
  type: interviewTypeSchema,
  interviewerIds: z.array(uuidSchema).min(1),
  scheduledAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().positive().default(60),
  meetingLink: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

export type ScheduleInterviewDto = z.infer<typeof scheduleInterviewSchema>;

export const interviewFeedbackSchema = z.object({
  applicationId: uuidSchema,
  roundNumber: z.number().int().positive(),
  overallRating: z.number().min(1).max(5),
  recommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']),
  competencyRatings: z.record(z.number().min(1).max(5)),
  strengths: z.string().max(2000),
  improvements: z.string().max(2000),
  notes: z.string().max(3000).optional(),
});

export type InterviewFeedbackDto = z.infer<typeof interviewFeedbackSchema>;

export const createOfferSchema = z.object({
  applicationId: uuidSchema,
  ctcBreakup: z.record(z.number()),
  totalCtc: z.number().positive(),
  joiningDate: z.string().date(),
  expiryDate: z.string().date(),
  offerLetterTemplateId: uuidSchema.optional(),
  customClauses: z.string().max(5000).optional(),
});

export type CreateOfferDto = z.infer<typeof createOfferSchema>;
