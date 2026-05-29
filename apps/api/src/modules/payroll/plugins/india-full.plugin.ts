import { Injectable } from '@nestjs/common';

import { PayrollContext, PayrollPlugin, StatutoryResult } from '../payroll.interface';

// Full India TDS computation using old and new tax regimes (FY 2026-27)
const NEW_REGIME_SLABS_2026 = [
  { limit: 300000, rate: 0 },
  { limit: 700000, rate: 0.05 },
  { limit: 1000000, rate: 0.1 },
  { limit: 1200000, rate: 0.15 },
  { limit: 1500000, rate: 0.2 },
  { limit: Infinity, rate: 0.3 },
];

const OLD_REGIME_SLABS_2026 = [
  { limit: 250000, rate: 0 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.2 },
  { limit: Infinity, rate: 0.3 },
];

// PT slab by state — Maharashtra rates
const PT_SLAB_MAHARASHTRA = [
  { min: 0, max: 7500, pt: 0 },
  { min: 7500, max: 10000, pt: 175 },
  { min: 10000, max: Infinity, pt: 200 },
];

function computeTax(
  annualIncome: number,
  slabs: Array<{ limit: number; rate: number }>,
): number {
  let tax = 0;
  let previous = 0;
  for (const slab of slabs) {
    if (annualIncome <= previous) break;
    const taxable = Math.min(annualIncome, slab.limit) - previous;
    tax += taxable * slab.rate;
    previous = slab.limit;
  }
  // 4% health and education cess
  tax *= 1.04;
  return Math.ceil(tax);
}

@Injectable()
export class IndiaFullPayrollPlugin implements PayrollPlugin {
  readonly countryCode = 'IN';

  async compute(ctx: PayrollContext): Promise<StatutoryResult> {
    const basic = ctx.components['BASIC'] ?? 0;
    const gross = ctx.components['GROSS'] ?? 0;

    // PF — 12% of basic capped at ₹15,000/month
    const pfBase = Math.min(basic, 15000);
    const employeePf = parseFloat((pfBase * 0.12).toFixed(2));
    const employerPf = parseFloat((pfBase * 0.12).toFixed(2));
    const employerEps = parseFloat((Math.min(basic, 15000) * 0.0833).toFixed(2));

    // ESI — applicable if gross ≤ ₹21,000/month
    let employeeEsi = 0;
    let employerEsi = 0;
    if (gross <= 21000) {
      employeeEsi = parseFloat((gross * 0.0075).toFixed(2));
      employerEsi = parseFloat((gross * 0.0325).toFixed(2));
    }

    // Professional Tax — Maharashtra slab (configurable per state in production)
    const ptEntry = PT_SLAB_MAHARASHTRA.find((s) => gross >= s.min && gross < s.max);
    const pt = ptEntry?.pt ?? 0;

    // TDS — simplified monthly computation (full regime uses tax declarations)
    // Annual taxable = (gross - PF_EE - ESI_EE - PT) * 12
    const annualGross = (gross - employeePf - employeeEsi - pt) * 12;
    // New regime is default from FY 2024-25
    const annualTax = computeTax(annualGross, NEW_REGIME_SLABS_2026);
    const monthlyTds = Math.round(annualTax / 12);

    return {
      employeeDeductions: {
        PF_EE: employeePf,
        ESI_EE: employeeEsi,
        PT: pt,
        TDS: monthlyTds,
      },
      employerContributions: {
        PF_ER: employerPf,
        EPS_ER: employerEps,
        ESI_ER: employerEsi,
      },
      tds: monthlyTds,
    };
  }
}
