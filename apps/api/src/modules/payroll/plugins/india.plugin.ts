import { Injectable } from '@nestjs/common';

import { PayrollContext, PayrollPlugin, StatutoryResult } from '../payroll.interface';

@Injectable()
export class IndiaPayrollPlugin implements PayrollPlugin {
  readonly countryCode = 'IN';

  async compute(ctx: PayrollContext): Promise<StatutoryResult> {
    const basic = ctx.components['BASIC'] ?? 0;
    const gross = ctx.components['GROSS'] ?? 0;

    // PF — 12% of basic capped at ₹15,000
    const pfBase = Math.min(basic, 15000);
    const employeePf = pfBase * 0.12;
    const employerPf = pfBase * 0.12;

    // ESI — applicable if gross ≤ ₹21,000
    let employeeEsi = 0;
    let employerEsi = 0;
    if (gross <= 21000) {
      employeeEsi = gross * 0.0075;
      employerEsi = gross * 0.0325;
    }

    // Professional Tax — simplified flat ₹200/month (full slab logic in Step 16)
    const pt = gross > 15000 ? 200 : gross > 10000 ? 150 : 0;

    // TDS — placeholder; full TDS engine (old/new regime) implemented in Step 7
    const tds = 0;

    return {
      employeeDeductions: {
        PF_EE: parseFloat(employeePf.toFixed(2)),
        ESI_EE: parseFloat(employeeEsi.toFixed(2)),
        PT: pt,
        TDS: tds,
      },
      employerContributions: {
        PF_ER: parseFloat(employerPf.toFixed(2)),
        ESI_ER: parseFloat(employerEsi.toFixed(2)),
      },
      tds,
    };
  }
}
