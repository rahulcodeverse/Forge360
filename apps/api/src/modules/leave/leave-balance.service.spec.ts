import { Test, TestingModule } from '@nestjs/testing';

import { LeaveBalanceService } from './leave-balance.service';
import { PrismaService } from '../database/prisma.service';

const mockPrisma = {
  leaveBalance: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
  },
  leaveTransaction: {
    create: jest.fn(),
  },
  $transaction: jest.fn((ops: Array<Promise<unknown>>) => Promise.all(ops)),
};

describe('LeaveBalanceService', () => {
  let service: LeaveBalanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveBalanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LeaveBalanceService>(LeaveBalanceService);
    jest.clearAllMocks();
  });

  describe('getBalances', () => {
    it('returns leave balances for an employee', async () => {
      const balances = [
        {
          leaveTypeId: 'lt-cl',
          year: 2026,
          opening: 0,
          accrued: 12,
          taken: 3,
          pending: 1,
          closing: 8,
          leaveType: { name: 'Casual Leave', code: 'CL' },
        },
      ];
      mockPrisma.leaveBalance.findMany.mockResolvedValue(balances);

      const result = await service.getBalances('emp-id', 'tenant-id', 2026);
      expect(result).toHaveLength(1);
      expect(result[0]?.leaveTypeId).toBe('lt-cl');
    });
  });

  describe('debit', () => {
    it('decrements pending and increments taken', async () => {
      mockPrisma.leaveBalance.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.leaveTransaction.create.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops));

      await service.debit('emp-id', 'tenant-id', 'lt-cl', 2026, 2, 'req-id');

      expect(mockPrisma.leaveBalance.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taken: { increment: 2 },
            pending: { decrement: 2 },
          }),
        }),
      );
    });
  });

  describe('credit', () => {
    it('upserts balance with accrual and creates transaction', async () => {
      mockPrisma.leaveBalance.upsert.mockResolvedValue({});
      mockPrisma.leaveTransaction.create.mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation((ops: unknown[]) => Promise.all(ops));

      await service.credit('emp-id', 'tenant-id', 'lt-el', 2026, 1.5, 'Monthly accrual');

      expect(mockPrisma.leaveBalance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            accrued: { increment: 1.5 },
          }),
        }),
      );
    });
  });
});
