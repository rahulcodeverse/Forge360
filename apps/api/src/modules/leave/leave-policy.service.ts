import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class LeavePolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async findByGrade(gradeId: string, tenantId: string) {
    return this.prisma.leavePolicy.findMany({
      where: { tenantId, gradeId },
      include: { leaveType: true },
    });
  }
}
