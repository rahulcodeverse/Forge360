import { Injectable } from '@nestjs/common';

import { PayrollContext, PayrollPlugin, StatutoryResult } from '../payroll.interface';

// UAE End-of-Service Gratuity — UAE Labour Law (Federal Law No. 8 of 1980, as amended)
// Computed per year of service at separation, not monthly.
// Monthly we compute the accrual provision.

export function computeUaeGratuity(params: {
  basicSalary: number;     // monthly basic
  serviceYears: number;    // total completed years
  isLimitedContract: boolean;
}): number {
  const { basicSalary, serviceYears, isLimitedContract } = params;

  if (serviceYears < 1) return 0;

  let gratuity = 0;

  if (isLimitedContract) {
    // Limited contract: 21 days per year for first 5 years, 30 days thereafter
    const first5Years = Math.min(serviceYears, 5);
    const beyond5Years = Math.max(0, serviceYears - 5);
    gratuity = (basicSalary / 30) * (first5Years * 21 + beyond5Years * 30);
  } else {
    // Unlimited contract: same formula
    const first5Years = Math.min(serviceYears, 5);
    const beyond5Years = Math.max(0, serviceYears - 5);
    gratuity = (basicSalary / 30) * (first5Years * 21 + beyond5Years * 30);
  }

  // Capped at 2 years' basic salary
  return Math.min(gratuity, basicSalary * 24);
}

@Injectable()
export class UaeFullPayrollPlugin implements PayrollPlugin {
  readonly countryCode = 'AE';

  async compute(ctx: PayrollContext): Promise<StatutoryResult> {
    const basic = ctx.components['BASIC'] ?? 0;

    // Monthly gratuity provision (accrual for accounting — assume average 3-year tenure)
    const monthlyGratuityProvision = parseFloat(((basic / 30) * 21 / 12).toFixed(2));

    // UAE has no employee income tax
    // WPS (Wage Protection System) file generated at payroll approval — not a deduction
    return {
      employeeDeductions: {},
      employerContributions: {
        GRATUITY_PROVISION: monthlyGratuityProvision,
      },
      tds: 0,
    };
  }
}
