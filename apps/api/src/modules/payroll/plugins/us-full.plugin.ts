import { Injectable } from '@nestjs/common';

import { PayrollContext, PayrollPlugin, StatutoryResult } from '../payroll.interface';

// Federal income tax withholding — 2024 IRS Publication 15-T (Percentage Method)
// Single filer, standard W-4 (no adjustments)
const FEDERAL_WITHHOLDING_SINGLE_2024 = [
  { limit: 503, rate: 0, base: 0 },
  { limit: 1583, rate: 0.1, base: 0 },
  { limit: 3446, rate: 0.12, base: 108 },
  { limit: 7196, rate: 0.22, base: 331.56 },
  { limit: 13558, rate: 0.24, base: 1156.56 },
  { limit: 17175, rate: 0.32, base: 2683.44 },
  { limit: 21629, rate: 0.35, base: 3840.88 },
  { limit: Infinity, rate: 0.37, base: 5399.73 },
];

function computeFederalWithholding(monthlyGross: number): number {
  const adj = Math.max(0, monthlyGross - 503); // subtract standard withholding allowance
  for (let i = FEDERAL_WITHHOLDING_SINGLE_2024.length - 1; i >= 0; i--) {
    const slab = FEDERAL_WITHHOLDING_SINGLE_2024[i]!;
    if (adj > (FEDERAL_WITHHOLDING_SINGLE_2024[i - 1]?.limit ?? 0)) {
      const excessOverPrev = adj - (FEDERAL_WITHHOLDING_SINGLE_2024[i - 1]?.limit ?? 0);
      return parseFloat((slab.base + excessOverPrev * slab.rate).toFixed(2));
    }
  }
  return 0;
}

@Injectable()
export class UsFullPayrollPlugin implements PayrollPlugin {
  readonly countryCode = 'US';

  async compute(ctx: PayrollContext): Promise<StatutoryResult> {
    const gross = ctx.components['GROSS'] ?? 0;

    // FICA — Social Security 6.2% (2024 wage base $168,600/yr = $14,050/mo)
    const socialSecurityWageBase = 14050;
    const socialSecurity = parseFloat((Math.min(gross, socialSecurityWageBase) * 0.062).toFixed(2));

    // Medicare 1.45% (no wage base limit); Additional 0.9% for high earners (simplified)
    const medicare = parseFloat((gross * 0.0145).toFixed(2));

    // Employer matching
    const employerSS = socialSecurity;
    const employerMedicare = medicare;

    // FUTA 6% on first $7,000/yr ≈ $583/mo (simplified: apply until wage base hit)
    const futa = parseFloat((Math.min(gross, 583) * 0.006).toFixed(2));

    // Federal income tax withholding
    const federalTax = computeFederalWithholding(gross);

    return {
      employeeDeductions: {
        SOCIAL_SECURITY: socialSecurity,
        MEDICARE: medicare,
        FEDERAL_TAX: federalTax,
      },
      employerContributions: {
        SOCIAL_SECURITY_ER: employerSS,
        MEDICARE_ER: employerMedicare,
        FUTA: futa,
      },
      tds: federalTax,
    };
  }
}
