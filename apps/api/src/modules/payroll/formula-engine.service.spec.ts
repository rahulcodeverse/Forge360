import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { FormulaEngineService } from './formula-engine.service';

describe('FormulaEngineService', () => {
  let service: FormulaEngineService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FormulaEngineService],
    }).compile();
    service = module.get(FormulaEngineService);
  });

  describe('India PF formula', () => {
    it('caps PF at ₹1,800 when BASIC > 15,000', () => {
      const result = service.evaluate('min(BASIC, 15000) * 0.12', { BASIC: 50000 });
      expect(result).toBe(1800);
    });

    it('computes PF correctly when BASIC = 15,000', () => {
      const result = service.evaluate('min(BASIC, 15000) * 0.12', { BASIC: 15000 });
      expect(result).toBe(1800);
    });

    it('computes PF proportionally when BASIC < 15,000', () => {
      const result = service.evaluate('min(BASIC, 15000) * 0.12', { BASIC: 10000 });
      expect(result).toBe(1200);
    });
  });

  describe('HRA formula', () => {
    it('computes HRA as 40% of BASIC', () => {
      const result = service.evaluate('BASIC * 0.4', { BASIC: 30000 });
      expect(result).toBe(12000);
    });
  });

  describe('ESI conditional formula', () => {
    it('applies ESI when GROSS <= 21000', () => {
      const result = service.evaluate('GROSS <= 21000 ? GROSS * 0.0075 : 0', { GROSS: 20000 });
      expect(result).toBe(150);
    });

    it('returns 0 for ESI when GROSS > 21000', () => {
      const result = service.evaluate('GROSS <= 21000 ? GROSS * 0.0075 : 0', { GROSS: 25000 });
      expect(result).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('returns 0 (not negative) for negative formula results', () => {
      const result = service.evaluate('BASIC - 99999', { BASIC: 10000 });
      expect(result).toBe(0); // Clamped to 0
    });

    it('throws BadRequestException for invalid expression', () => {
      expect(() => service.evaluate('BASIC *** HRA', { BASIC: 1, HRA: 1 })).toThrow(
        BadRequestException,
      );
    });

    it('handles zero salary correctly', () => {
      const result = service.evaluate('BASIC * 0.12', { BASIC: 0 });
      expect(result).toBe(0);
    });

    it('handles mid-month joining (LOP proportional)', () => {
      // 10 LOP days in 22-working-day month = 10/22 deduction
      const result = service.evaluate('BASIC * (22 - LOP_DAYS) / 22', {
        BASIC: 30000,
        LOP_DAYS: 10,
      });
      expect(result).toBeCloseTo((30000 * 12) / 22, 0);
    });
  });

  describe('validate', () => {
    it('returns true for valid expression', () => {
      expect(service.validate('BASIC * 0.4', ['BASIC'])).toBe(true);
    });

    it('returns false for syntax error', () => {
      expect(service.validate('BASIC *** 0.4', ['BASIC'])).toBe(false);
    });
  });

  describe('India statutory plugin integration', () => {
    it('computes full India statutory correctly', async () => {
      const { IndiaPayrollPlugin } = await import('./plugins/india.plugin');
      const plugin = new IndiaPayrollPlugin();

      const ctx = {
        employeeId: 'emp-id',
        tenantId: 'tenant-id',
        month: 5,
        year: 2026,
        workingDays: 22,
        presentDays: 22,
        lopDays: 0,
        components: { BASIC: 30000, HRA: 12000, GROSS: 45000 },
        country: 'IN',
      };

      const result = await plugin.compute(ctx);

      expect(result.employeeDeductions['PF_EE']).toBe(1800); // min(30000, 15000) * 0.12
      expect(result.employerContributions['PF_ER']).toBe(1800);
      expect(result.employeeDeductions['ESI_EE']).toBe(0); // GROSS > 21000 → no ESI
      expect(result.employeeDeductions['PT']).toBe(200);
    });

    it('applies ESI when GROSS <= 21000', async () => {
      const { IndiaPayrollPlugin } = await import('./plugins/india.plugin');
      const plugin = new IndiaPayrollPlugin();

      const result = await plugin.compute({
        employeeId: 'emp-id',
        tenantId: 'tenant-id',
        month: 5,
        year: 2026,
        workingDays: 22,
        presentDays: 22,
        lopDays: 0,
        components: { BASIC: 10000, HRA: 4000, GROSS: 15000 },
        country: 'IN',
      });

      expect(result.employeeDeductions['ESI_EE']).toBe(parseFloat((15000 * 0.0075).toFixed(2)));
      expect(result.employerContributions['ESI_ER']).toBe(parseFloat((15000 * 0.0325).toFixed(2)));
    });
  });
});
