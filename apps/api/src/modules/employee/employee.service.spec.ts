import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';

import { EmployeeService } from './employee.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

const mockPrisma = {
  employee: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    create: jest.fn(),
  },
  department: { findMany: jest.fn() },
  designation: { findMany: jest.fn() },
  grade: { findMany: jest.fn() },
  location: { findMany: jest.fn() },
};

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: getQueueToken('bulk-import'), useValue: { add: jest.fn() } },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('throws NotFoundException when employee does not exist', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue(null);
      await expect(service.findById('non-existent', 'tenant')).rejects.toThrow(NotFoundException);
    });

    it('returns employee with fullName computed', async () => {
      const mockEmployee = {
        id: 'emp-1',
        firstName: 'Rahul',
        middleName: null,
        lastName: 'Sharma',
        workEmail: 'rahul@acme.com',
        department: null,
        designation: null,
        grade: null,
        location: null,
        costCenter: null,
        reportingManager: null,
        directReports: [],
        documents: [],
        assets: [],
      };
      mockPrisma.employee.findFirst.mockResolvedValue(mockEmployee);

      const result = await service.findById('emp-1', 'tenant');
      expect(result.fullName).toBe('Rahul Sharma');
    });
  });

  describe('validateBulkImport', () => {
    it('returns errors for missing required fields', async () => {
      const rows = [
        { firstName: 'Rahul' }, // missing lastName, workEmail, joiningDate
      ];
      const result = await service.validateBulkImport('tenant', rows);
      expect(result.invalid).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('validates email format', async () => {
      const rows = [
        {
          firstName: 'Rahul',
          lastName: 'Sharma',
          workEmail: 'not-an-email',
          joiningDate: '2026-01-01',
        },
      ];
      const result = await service.validateBulkImport('tenant', rows);
      expect(result.errors.some((e) => e.field === 'workEmail')).toBe(true);
    });

    it('returns all rows as valid when data is correct', async () => {
      const rows = [
        {
          firstName: 'Rahul',
          lastName: 'Sharma',
          workEmail: 'rahul@example.com',
          joiningDate: '2026-01-01',
        },
        {
          firstName: 'Priya',
          lastName: 'Patel',
          workEmail: 'priya@example.com',
          joiningDate: '2026-01-01',
        },
      ];
      const result = await service.validateBulkImport('tenant', rows);
      expect(result.valid).toBe(2);
      expect(result.invalid).toBe(0);
    });
  });

  describe('create', () => {
    it('throws ConflictException when email already exists', async () => {
      mockPrisma.employee.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(
          'tenant',
          {
            firstName: 'Rahul',
            lastName: 'Sharma',
            workEmail: 'existing@acme.com',
            joiningDate: '2026-01-01',
            employmentType: 'full_time',
          },
          'actor-id',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getOrgChart', () => {
    it('returns org chart with root nodes and children', async () => {
      const employees = [
        { id: 'ceo', firstName: 'CEO', lastName: 'User', reportingManagerId: null, designation: null, department: null, profilePhotoUrl: null, employeeCode: 'EMP0001' },
        { id: 'vp', firstName: 'VP', lastName: 'User', reportingManagerId: 'ceo', designation: null, department: null, profilePhotoUrl: null, employeeCode: 'EMP0002' },
        { id: 'mgr', firstName: 'Manager', lastName: 'User', reportingManagerId: 'vp', designation: null, department: null, profilePhotoUrl: null, employeeCode: 'EMP0003' },
      ];
      mockPrisma.employee.findMany.mockResolvedValue(employees);

      const result = await service.getOrgChart('tenant');
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('ceo');
      expect((result[0] as unknown as { children: unknown[] })?.children).toHaveLength(1);
      expect((result[0] as unknown as { children: { id: string }[] })?.children[0]?.id).toBe('vp');
    });
  });
});
