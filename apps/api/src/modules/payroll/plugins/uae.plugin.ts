import { Injectable } from '@nestjs/common';

import { PayrollContext, PayrollPlugin, StatutoryResult } from '../payroll.interface';

@Injectable()
export class UaePayrollPlugin implements PayrollPlugin {
  readonly countryCode = 'AE';

  async compute(_ctx: PayrollContext): Promise<StatutoryResult> {
    // UAE has no income tax. End-of-service gratuity computed separately at separation.
    return {
      employeeDeductions: {},
      employerContributions: {},
      tds: 0,
    };
  }
}
