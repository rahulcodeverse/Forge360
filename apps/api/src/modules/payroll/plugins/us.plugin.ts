import { Injectable } from '@nestjs/common';

import { PayrollContext, PayrollPlugin, StatutoryResult } from '../payroll.interface';

@Injectable()
export class UsPayrollPlugin implements PayrollPlugin {
  readonly countryCode = 'US';

  async compute(ctx: PayrollContext): Promise<StatutoryResult> {
    const gross = ctx.components['GROSS'] ?? 0;

    // FICA — Social Security 6.2% (wage base $168,600 for 2024), Medicare 1.45%
    const socialSecurity = gross * 0.062;
    const medicare = gross * 0.0145;

    // Federal income tax withholding — simplified (full W-4 calculation in Step 16)
    const federalTax = 0;

    return {
      employeeDeductions: {
        SOCIAL_SECURITY: parseFloat(socialSecurity.toFixed(2)),
        MEDICARE: parseFloat(medicare.toFixed(2)),
        FEDERAL_TAX: federalTax,
      },
      employerContributions: {
        SOCIAL_SECURITY_ER: parseFloat(socialSecurity.toFixed(2)),
        MEDICARE_ER: parseFloat(medicare.toFixed(2)),
        FUTA: parseFloat((gross * 0.006).toFixed(2)),
      },
      tds: federalTax,
    };
  }
}
