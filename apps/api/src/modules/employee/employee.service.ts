import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaginationDto, paginate } from '../../common/pagination/pagination.dto';

export interface CreateEmployeeData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  personalEmail?: string;
  workEmail: string;
  phone?: string;
  joiningDate: string;
  probationEndDate?: string;
  employmentType: string;
  departmentId?: string;
  designationId?: string;
  gradeId?: string;
  locationId?: string;
  costCenterId?: string;
  reportingManagerId?: string;
  emergencyContact?: Record<string, unknown>;
  currentAddress?: Record<string, unknown>;
  permanentAddress?: Record<string, unknown>;
}

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @InjectQueue('bulk-import') private readonly importQueue: Queue,
  ) {}

  async findAll(tenantId: string, dto: PaginationDto) {
    const where = {
      tenantId,
      deletedAt: null,
      ...(dto.search && {
        OR: [
          { firstName: { contains: dto.search, mode: 'insensitive' as const } },
          { lastName: { contains: dto.search, mode: 'insensitive' as const } },
          { workEmail: { contains: dto.search, mode: 'insensitive' as const } },
          { employeeCode: { contains: dto.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: dto.skip,
        take: dto.limit,
        orderBy: dto.sortBy
          ? { [dto.sortBy]: dto.sortOrder }
          : { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true } },
          designation: { select: { id: true, name: true } },
          grade: { select: { id: true, name: true } },
          location: { select: { id: true, name: true, country: true } },
          reportingManager: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true },
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return paginate(
      items.map((e) => ({
        ...e,
        fullName: `${e.firstName} ${e.middleName ? e.middleName + ' ' : ''}${e.lastName}`,
      })),
      total,
      dto,
    );
  }

  async findById(id: string, tenantId: string) {
    const emp = await this.prisma.employee.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        department: true,
        designation: true,
        grade: true,
        location: true,
        costCenter: true,
        reportingManager: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, workEmail: true },
        },
        directReports: {
          where: { deletedAt: null },
          select: { id: true, firstName: true, lastName: true, employeeCode: true, designationId: true },
        },
        documents: { orderBy: { createdAt: 'desc' } },
        assets: {
          where: { returnedAt: null },
          include: { asset: true },
        },
      },
    });

    if (!emp) throw new NotFoundException(`Employee ${id} not found`);
    return { ...emp, fullName: `${emp.firstName}${emp.middleName ? ' ' + emp.middleName : ''} ${emp.lastName}` };
  }

  async create(tenantId: string, data: CreateEmployeeData, actorId: string) {
    // Check email uniqueness
    const existing = await this.prisma.employee.findFirst({
      where: { tenantId, workEmail: data.workEmail, deletedAt: null },
    });
    if (existing) throw new ConflictException(`Email ${data.workEmail} already registered`);

    // Generate employee code
    const count = await this.prisma.employee.count({ where: { tenantId } });
    const employeeCode = `EMP${String(count + 1).padStart(4, '0')}`;

    // Create user account for the employee
    const passwordHash = await bcrypt.hash(`Welcome@${new Date().getFullYear()}`, 12);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: data.workEmail,
        passwordHash,
        role: 'employee',
        isActive: true,
      },
    });

    const employee = await this.prisma.employee.create({
      data: {
        tenantId,
        employeeCode,
        userId: user.id,
        firstName: data.firstName,
        middleName: data.middleName ?? null,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender ?? null,
        personalEmail: data.personalEmail ?? null,
        workEmail: data.workEmail,
        phone: data.phone ?? null,
        joiningDate: new Date(data.joiningDate),
        probationEndDate: data.probationEndDate ? new Date(data.probationEndDate) : null,
        employmentType: data.employmentType,
        employmentStatus: 'probation',
        departmentId: data.departmentId ?? null,
        designationId: data.designationId ?? null,
        gradeId: data.gradeId ?? null,
        locationId: data.locationId ?? null,
        costCenterId: data.costCenterId ?? null,
        reportingManagerId: data.reportingManagerId ?? null,
        emergencyContact: (data.emergencyContact ?? undefined) as never,
        currentAddress: (data.currentAddress ?? undefined) as never,
        permanentAddress: (data.permanentAddress ?? undefined) as never,
      },
      include: {
        department: true,
        designation: true,
        grade: true,
        location: true,
      },
    });

    await this.audit.log({
      tenantId,
      actorId,
      module: 'employees',
      action: 'CREATE',
      entityType: 'employee',
      entityId: employee.id,
      after: { employeeCode, workEmail: data.workEmail },
    });

    return employee;
  }

  async update(id: string, tenantId: string, data: Partial<CreateEmployeeData>, actorId: string) {
    const before = await this.findById(id, tenantId);

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        ...Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== undefined),
        ),
        updatedAt: new Date(),
      },
    });

    await this.audit.log({
      tenantId,
      actorId,
      module: 'employees',
      action: 'UPDATE',
      entityType: 'employee',
      entityId: id,
      before: before as unknown as Record<string, unknown>,
      after: data as Record<string, unknown>,
    });

    return updated;
  }

  async softDelete(id: string, tenantId: string, actorId: string): Promise<void> {
    await this.findById(id, tenantId); // throws if not found

    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), employmentStatus: 'terminated' },
    });

    await this.audit.log({
      tenantId,
      actorId,
      module: 'employees',
      action: 'DELETE',
      entityType: 'employee',
      entityId: id,
    });
  }

  // ── Org chart ────────────────────────────────────────────────────────────

  async getOrgChart(tenantId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { tenantId, deletedAt: null, employmentStatus: 'active' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeCode: true,
        profilePhotoUrl: true,
        reportingManagerId: true,
        designation: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    // Build adjacency list → tree structure
    const nodeMap = new Map(employees.map((e) => [e.id, { ...e, children: [] as typeof employees }]));
    const roots: typeof employees = [];

    for (const emp of employees) {
      if (!emp.reportingManagerId || !nodeMap.has(emp.reportingManagerId)) {
        roots.push(nodeMap.get(emp.id)!);
      } else {
        nodeMap.get(emp.reportingManagerId)!.children.push(nodeMap.get(emp.id)!);
      }
    }

    return roots;
  }

  // ── Bulk import ──────────────────────────────────────────────────────────

  async validateBulkImport(
    tenantId: string,
    rows: Array<Record<string, unknown>>,
  ) {
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const valid: typeof rows = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowErrors: typeof errors = [];

      if (!row['firstName']) rowErrors.push({ row: i + 2, field: 'firstName', message: 'Required' });
      if (!row['lastName']) rowErrors.push({ row: i + 2, field: 'lastName', message: 'Required' });
      if (!row['workEmail']) rowErrors.push({ row: i + 2, field: 'workEmail', message: 'Required' });
      if (row['workEmail'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row['workEmail']))) {
        rowErrors.push({ row: i + 2, field: 'workEmail', message: 'Invalid email format' });
      }
      if (!row['joiningDate']) rowErrors.push({ row: i + 2, field: 'joiningDate', message: 'Required' });

      if (rowErrors.length === 0) {
        valid.push(row);
      }
      errors.push(...rowErrors);
    }

    return {
      total: rows.length,
      valid: valid.length,
      invalid: rows.length - valid.length,
      errors,
    };
  }

  async queueBulkImport(tenantId: string, fileKey: string, actorId: string): Promise<string> {
    const job = await this.importQueue.add('process-import', {
      tenantId,
      fileKey,
      actorId,
    });
    return String(job.id);
  }

  // ── Departments ──────────────────────────────────────────────────────────

  async getDepartments(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId, isActive: true },
      include: {
        _count: { select: { employees: { where: { deletedAt: null } } } },
        children: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getDesignations(tenantId: string) {
    return this.prisma.designation.findMany({
      where: { tenantId, isActive: true },
      include: { grade: true },
      orderBy: { name: 'asc' },
    });
  }

  async getGrades(tenantId: string) {
    return this.prisma.grade.findMany({
      where: { tenantId, isActive: true },
      orderBy: { level: 'asc' },
    });
  }

  async getLocations(tenantId: string) {
    return this.prisma.location.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
