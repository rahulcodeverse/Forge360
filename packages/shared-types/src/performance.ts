import { z } from 'zod';

import { approvalStatusSchema, dateStringSchema, uuidSchema } from './common';

export const goalTypeSchema = z.enum(['okr', 'kra', 'individual', 'department', 'company']);
export type GoalType = z.infer<typeof goalTypeSchema>;

export const reviewTypeSchema = z.enum(['annual', 'mid_year', 'probation', 'pip']);
export type ReviewType = z.infer<typeof reviewTypeSchema>;

export const reviewerTypeSchema = z.enum(['self', 'peer', 'manager', 'skip_level', 'hr']);
export type ReviewerType = z.infer<typeof reviewerTypeSchema>;

export const goalCycleSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  type: goalTypeSchema,
  isActive: z.boolean(),
});

export type GoalCycle = z.infer<typeof goalCycleSchema>;

export const createGoalSchema = z
  .object({
    cycleId: uuidSchema,
    title: z.string().min(5).max(300),
    description: z.string().max(2000).optional(),
    weight: z.number().min(0).max(100),
    targetValue: z.number().optional(),
    unit: z.string().optional(),
    parentGoalId: uuidSchema.optional(),
  })
  .refine((d) => d.weight >= 0 && d.weight <= 100, {
    message: 'Weight must be between 0 and 100',
  });

export type CreateGoalDto = z.infer<typeof createGoalSchema>;

export const goalProgressSchema = z.object({
  actualValue: z.number(),
  progressNote: z.string().max(2000).optional(),
});

export type GoalProgressDto = z.infer<typeof goalProgressSchema>;

export const reviewCycleSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  type: reviewTypeSchema,
  goalCycleId: uuidSchema.nullable(),
  timeline: z.object({
    goalSettingStart: z.string().date(),
    goalSettingEnd: z.string().date(),
    selfReviewStart: z.string().date(),
    selfReviewEnd: z.string().date(),
    peerNominationStart: z.string().date().optional(),
    peerNominationEnd: z.string().date().optional(),
    peerReviewStart: z.string().date().optional(),
    peerReviewEnd: z.string().date().optional(),
    managerReviewStart: z.string().date(),
    managerReviewEnd: z.string().date(),
    calibrationDate: z.string().date().optional(),
    resultsDate: z.string().date(),
  }),
  isActive: z.boolean(),
});

export type ReviewCycle = z.infer<typeof reviewCycleSchema>;

export const reviewQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('rating'),
    id: z.string(),
    text: z.string(),
    minRating: z.number().default(1),
    maxRating: z.number().default(5),
    required: z.boolean(),
  }),
  z.object({
    type: z.literal('text'),
    id: z.string(),
    text: z.string(),
    maxLength: z.number().default(2000),
    required: z.boolean(),
  }),
  z.object({
    type: z.literal('competency'),
    id: z.string(),
    text: z.string(),
    competencies: z.array(z.object({ id: z.string(), name: z.string() })),
    required: z.boolean(),
  }),
  z.object({
    type: z.literal('nps'),
    id: z.string(),
    text: z.string(),
    required: z.boolean(),
  }),
]);

export type ReviewQuestion = z.infer<typeof reviewQuestionSchema>;

export const reviewSubmissionSchema = z.object({
  cycleId: uuidSchema,
  revieweeId: uuidSchema,
  reviewerType: reviewerTypeSchema,
  responses: z.array(
    z.object({
      questionId: z.string(),
      rating: z.number().optional(),
      text: z.string().optional(),
      competencyRatings: z.record(z.number()).optional(),
    }),
  ),
  overallRating: z.number().min(1).max(5).optional(),
  summaryComment: z.string().max(3000).optional(),
});

export type ReviewSubmissionDto = z.infer<typeof reviewSubmissionSchema>;

export const pipPlanSchema = z.object({
  employeeId: uuidSchema,
  reviewCycleId: uuidSchema.optional(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  goals: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      successCriteria: z.string(),
      dueDate: z.string().date(),
    }),
  ),
  requiredTraining: z.array(uuidSchema),
  reviewFrequencyDays: z.number().int().positive().default(7),
  managerId: uuidSchema,
});

export type PipPlanDto = z.infer<typeof pipPlanSchema>;
