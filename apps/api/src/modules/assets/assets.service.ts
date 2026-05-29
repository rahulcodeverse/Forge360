import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PaginationDto, paginate } from '../../common/pagination/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listAssets(tenantId: string, dto: PaginationDto) {
    const where = { tenantId, isActive: true };
    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: {
          assignments: {
            where: { returnedAt: null },
            include: {
              employee: {
                select: { id: true, employeeCode: true, firstName: true, lastName: true, workEmail: true },
              },
            },
          },
        },
        skip: dto.skip,
        take: dto.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.asset.count({ where }),
    ]);
    return paginate(items, total, dto);
  }

  async listAssignments(tenantId: string, dto: PaginationDto) {
    const where = { tenantId, returnedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.assetAssignment.findMany({
        where,
        include: {
          asset: true,
          employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, workEmail: true } },
        },
        skip: dto.skip,
        take: dto.limit,
        orderBy: { assignedAt: 'desc' },
      }),
      this.prisma.assetAssignment.count({ where }),
    ]);
    return paginate(items, total, dto);
  }

  async create(
    tenantId: string,
    data: {
      name: string;
      assetCode: string;
      type: string;
      serialNumber?: string;
      purchaseDate?: string;
      purchaseCost?: number;
    },
  ) {
    return this.prisma.asset.create({
      data: {
        tenantId,
        name: data.name,
        assetCode: data.assetCode,
        type: data.type,
        serialNumber: data.serialNumber ?? null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost ?? null,
      },
    });
  }

  async assign(
    tenantId: string,
    assetId: string,
    data: { employeeId: string; condition?: string; notes?: string },
    actorId: string,
  ) {
    const [asset, employee, activeAssignment] = await Promise.all([
      this.prisma.asset.findFirst({ where: { tenantId, id: assetId, isActive: true } }),
      this.prisma.employee.findFirst({ where: { tenantId, id: data.employeeId, deletedAt: null } }),
      this.prisma.assetAssignment.findFirst({ where: { tenantId, assetId, returnedAt: null } }),
    ]);
    if (!asset) throw new NotFoundException('Asset not found');
    if (!employee) throw new NotFoundException('Employee not found');
    if (activeAssignment) throw new BadRequestException('Asset is already assigned');

    const assignment = await this.prisma.assetAssignment.create({
      data: {
        tenantId,
        assetId,
        employeeId: data.employeeId,
        condition: data.condition ?? null,
        notes: data.notes ?? null,
      },
      include: { asset: true, employee: true },
    });

    await this.audit.log({
      tenantId,
      actorId,
      module: 'assets',
      action: 'CREATE',
      entityType: 'asset_assignment',
      entityId: assignment.id,
      after: { assetId, employeeId: data.employeeId },
    });

    return assignment;
  }

  async returnAsset(tenantId: string, assignmentId: string, actorId: string) {
    const assignment = await this.prisma.assetAssignment.findFirst({
      where: { tenantId, id: assignmentId, returnedAt: null },
    });
    if (!assignment) throw new NotFoundException('Active assignment not found');

    const updated = await this.prisma.assetAssignment.update({
      where: { id: assignmentId },
      data: { returnedAt: new Date() },
      include: { asset: true, employee: true },
    });

    await this.audit.log({
      tenantId,
      actorId,
      module: 'assets',
      action: 'UPDATE',
      entityType: 'asset_assignment',
      entityId: assignmentId,
      before: { returnedAt: null },
      after: { returnedAt: updated.returnedAt },
    });

    return updated;
  }
}
