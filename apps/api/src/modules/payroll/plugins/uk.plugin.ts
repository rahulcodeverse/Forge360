import { Injectable } from '@nestjs/common';

import { PayrollContext, PayrollPlugin, StatutoryResult } from '../payroll.interface';

@Injectable()
export class UkPayrollPlugin implements PayrollPlugin {
  readonly countryCode = 'GB';

  async compute(ctx: PayrollContext): Promise<StatutoryResult> {
    const gross = ctx.components['GROSS'] ?? 0;

    // NI Class 1 employee — 8% on earnings £12,570–£50,270/yr (£1,047.50–£4,189/mo)
    const niLowerMonthly = 1047.5;
    const niUpperMonthly = 4189;
    const niBase = Math.max(0, Math.min(gross, niUpperMonthly) - niLowerMonthly);
    const employeeNi = niBase * 0.08;

    // Employer NI — 13.8% above secondary threshold (£758/mo)
    const niSecondaryMonthly = 758;
    const employerNi = Math.max(0, gross - niSecondaryMonthly) * 0.138;

    // PAYE — simplified; full calculation in Step 16
    const paye = 0;

    return {
      employeeDeductions: {
        PAYE: paye,
        NI_EE: parseFloat(employeeNi.toFixed(2)),
      },
      employerContributions: {
        NI_ER: parseFloat(employerNi.toFixed(2)),
      },
      tds: paye,
    };
  }
}
