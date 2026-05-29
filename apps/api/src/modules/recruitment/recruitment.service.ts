import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { PaginationDto, paginate } from '../../common/pagination/pagination.dto';

@Injectable()
export class RecruitmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  // ── Job requisitions ─────────────────────────────────────────────────────

  async getRequisitions(tenantId: string, dto: PaginationDto, status?: string) {
    const where = { tenantId, ...(status && { status }) };
    const [items, total] = await Promise.all([
      this.prisma.jobRequisition.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { name: true } },
          grade: { select: { name: true } },
          location: { select: { name: true, country: true } },
          _count: { select: { postings: true } },
        },
      }),
      this.prisma.jobRequisition.count({ where }),
    ]);
    return paginate(items, total, dto);
  }

  async createRequisition(
    tenantId: string,
    createdBy: string,
    data: {
      title: string;
      departmentId: string;
      gradeId: string;
      locationId: string;
      vacancies: number;
      employmentType: string;
      jdContent: string;
      skills: string[];
      minExperienceYears: number;
      maxExperienceYears?: number;
      targetDate?: string;
      priority?: string;
    },
  ) {
    const req = await this.prisma.jobRequisition.create({
      data: {
        tenantId,
        createdBy,
        ...data,
        skills: data.skills,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status: 'draft',
      },
    });

    await this.audit.log({
      tenantId,
      actorId: createdBy,
      module: 'recruitment',
      action: 'CREATE',
      entityType: 'job_requisition',
      entityId: req.id,
      after: { title: data.title, vacancies: data.vacancies },
    });

    return req;
  }

  async approveRequisition(reqId: string, tenantId: string, approverId: string): Promise<void> {
    await this.prisma.jobRequisition.updateMany({
      where: { id: reqId, tenantId, status: 'pending_approval' },
      data: { status: 'approved', approvedAt: new Date() },
    });
  }

  // ── Job postings ─────────────────────────────────────────────────────────

  async publishPosting(
    requisitionId: string,
    tenantId: string,
    platform: string,
  ) {
    const req = await this.prisma.jobRequisition.findFirst({
      where: { id: requisitionId, tenantId, status: 'approved' },
    });
    if (!req) throw new NotFoundException('Approved requisition not found');

    return this.prisma.jobPosting.create({
      data: {
        tenantId,
        requisitionId,
        platform,
        publishedAt: new Date(),
      },
    });
  }

  // ── Applications ─────────────────────────────────────────────────────────

  async getApplications(tenantId: string, dto: PaginationDto, stage?: string) {
    const where = { tenantId, ...(stage && { stage }) };
    const [items, total] = await Promise.all([
      this.prisma.application.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          candidate: true,
          posting: {
            include: { requisition: { select: { title: true, department: { select: { name: true } } } } },
          },
          interviews: { orderBy: { roundNumber: 'asc' } },
          offer: true,
        },
      }),
      this.prisma.application.count({ where }),
    ]);
    return paginate(items, total, dto);
  }

  async moveStage(
    applicationId: string,
    tenantId: string,
    newStage: string,
    actorId: string,
  ) {
    const validTransitions: Record<string, string[]> = {
      applied: ['screening', 'rejected'],
      screening: ['interview', 'rejected'],
      interview: ['offer', 'rejected'],
      offer: ['hired', 'rejected'],
    };

    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, tenantId },
    });
    if (!app) throw new NotFoundException('Application not found');

    const allowed = validTransitions[app.stage];
    if (!allowed?.includes(newStage)) {
      throw new BadRequestException(`Cannot move from ${app.stage} to ${newStage}`);
    }

    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        stage: newStage,
        ...(newStage === 'rejected' && { rejectedAt: new Date() }),
        ...(newStage === 'hired' && { hiredAt: new Date() }),
      },
    });

    await this.audit.log({
      tenantId,
      actorId,
      module: 'recruitment',
      action: 'UPDATE',
      entityType: 'application',
      entityId: applicationId,
      before: { stage: app.stage },
      after: { stage: newStage },
    });

    return updated;
  }

  // ── Interviews ───────────────────────────────────────────────────────────

  async scheduleInterview(
    applicationId: string,
    tenantId: string,
    data: {
      roundNumber: number;
      type: string;
      interviewerIds: string[];
      scheduledAt: string;
      durationMinutes?: number;
      meetingLink?: string;
      notes?: string;
    },
  ) {
    const existing = await this.prisma.interviewRound.findUnique({
      where: { applicationId_roundNumber: { applicationId, roundNumber: data.roundNumber } },
    });
    if (existing) throw new BadRequestException(`Round ${data.roundNumber} already scheduled`);

    return this.prisma.interviewRound.create({
      data: {
        tenantId,
        applicationId,
        roundNumber: data.roundNumber,
        type: data.type,
        interviewerIds: data.interviewerIds,
        scheduledAt: new Date(data.scheduledAt),
        durationMinutes: data.durationMinutes ?? 60,
        meetingLink: data.meetingLink ?? null,
        status: 'scheduled',
      },
    });
  }

  async submitInterviewFeedback(
    applicationId: string,
    roundNumber: number,
    tenantId: string,
    data: {
      overallRating: number;
      recommendation: string;
      competencyRatings?: Record<string, number>;
      feedback: string;
    },
  ) {
    return this.prisma.interviewRound.update({
      where: { applicationId_roundNumber: { applicationId, roundNumber } },
      data: {
        feedback: data.feedback,
        overallRating: data.overallRating,
        recommendation: data.recommendation,
        competencyRatings: data.competencyRatings ?? {},
        status: 'completed',
        completedAt: new Date(),
      },
    });
  }

  // ── Offers ───────────────────────────────────────────────────────────────

  async createOffer(
    applicationId: string,
    tenantId: string,
    data: {
      ctcBreakup: Record<string, number>;
      totalCtc: number;
      joiningDate: string;
      expiryDate: string;
    },
  ) {
    const app = await this.prisma.application.findFirst({
      where: { id: applicationId, tenantId, stage: 'offer' },
    });
    if (!app) throw new NotFoundException('Application not in offer stage');

    return this.prisma.offer.upsert({
      where: { applicationId },
      create: {
        tenantId,
        applicationId,
        ctcBreakup: data.ctcBreakup,
        totalCtc: data.totalCtc,
        joiningDate: new Date(data.joiningDate),
        expiryDate: new Date(data.expiryDate),
        status: 'draft',
      },
      update: {
        ctcBreakup: data.ctcBreakup,
        totalCtc: data.totalCtc,
        joiningDate: new Date(data.joiningDate),
        expiryDate: new Date(data.expiryDate),
      },
    });
  }

  // ── Analytics ────────────────────────────────────────────────────────────

  async getRecruitmentAnalytics(tenantId: string, fromDate: Date, toDate: Date) {
    const [total, byStage, hired, rejected] = await Promise.all([
      this.prisma.application.count({
        where: { tenantId, createdAt: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.application.groupBy({
        by: ['stage'],
        where: { tenantId, createdAt: { gte: fromDate, lte: toDate } },
        _count: true,
      }),
      this.prisma.application.count({
        where: { tenantId, stage: 'hired', createdAt: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.application.count({
        where: { tenantId, stage: 'rejected', createdAt: { gte: fromDate, lte: toDate } },
      }),
    ]);

    const offerAcceptanceRate = total > 0 ? parseFloat(((hired / total) * 100).toFixed(1)) : 0;

    return {
      totalApplications: total,
      byStage,
      hired,
      rejected,
      offerAcceptanceRate,
    };
  }
}
