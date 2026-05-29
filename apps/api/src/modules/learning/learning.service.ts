import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { PaginationDto, paginate } from '../../common/pagination/pagination.dto';

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaService) {}

  async getCourses(tenantId: string, dto: PaginationDto, type?: string) {
    const where = {
      tenantId,
      isPublished: true,
      isActive: true,
      ...(type && { type }),
    };

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);
    return paginate(items, total, dto);
  }

  async enroll(employeeId: string, tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId, isPublished: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.courseEnrollment.upsert({
      where: { employeeId_courseId: { employeeId, courseId } },
      create: {
        tenantId,
        employeeId,
        courseId,
        status: 'enrolled',
        progressPercent: 0,
      },
      update: { status: 'enrolled' },
    });
  }

  async updateProgress(
    employeeId: string,
    tenantId: string,
    courseId: string,
    progressPercent: number,
  ) {
    const status = progressPercent >= 100 ? 'completed' : 'in_progress';

    return this.prisma.courseEnrollment.update({
      where: { employeeId_courseId: { employeeId, courseId } },
      data: {
        progressPercent: Math.min(100, progressPercent),
        status,
        ...(status === 'in_progress' && !await this.hasStarted(employeeId, courseId) && {
          startedAt: new Date(),
        }),
        ...(status === 'completed' && { completedAt: new Date() }),
      },
    });
  }

  async getEnrollments(employeeId: string, tenantId: string) {
    return this.prisma.courseEnrollment.findMany({
      where: { employeeId, tenantId },
      include: { course: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSkillGaps(employeeId: string, tenantId: string) {
    // Get employee's designation required skills vs actual skills
    // Full implementation in Step 10
    return { employeeId, gaps: [] };
  }

  private async hasStarted(employeeId: string, courseId: string): Promise<boolean> {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { employeeId_courseId: { employeeId, courseId } },
      select: { startedAt: true },
    });
    return !!enrollment?.startedAt;
  }
}
